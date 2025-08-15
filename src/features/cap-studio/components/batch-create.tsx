import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Upload,
  XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import { CapSchema } from '@/shared/types/cap';
import { useAvailableModels } from '../hooks';
import { useLocalCapsHandler } from '../hooks/use-local-caps-handler';
import type { LocalCap } from '../types';

interface BatchCreateProps {
  onBatchCreate?: (caps: LocalCap[]) => void;
}

// simplified Cap input format, without id, authorDID, submittedAt
interface SimplifiedCapInput {
  idName: string;
  metadata: {
    displayName: string;
    description: string;
    tags: string[];
    thumbnail?: {
      type: 'url';
      url: string;
    };
    homepage?: string;
    repository?: string;
  };
  core: {
    prompt: {
      value: string;
      suggestions?: string[];
    };
    modelId: string; // only model ID
    mcpServers?: Record<
      string,
      {
        url: string;
        transport: string;
      }
    >;
  };
}

export function BatchCreate({ onBatchCreate }: BatchCreateProps) {
  const navigate = useNavigate();
  const { did } = useAuth();
  const { models } = useAvailableModels();
  const { createCap } = useLocalCapsHandler();
  const [uploading, setUploading] = useState(false);
  const [showJsonFormat, setShowJsonFormat] = useState(false);
  const [parsedData, setParsedData] = useState<{
    validCaps: SimplifiedCapInput[];
    invalidCaps: { cap: any; error: string }[];
  } | null>(null);
  const [uploadResults, setUploadResults] = useState<{
    success: LocalCap[];
    errors: { cap: any; error: string }[];
  }>({ success: [], errors: [] });
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // validate simplified Cap input format
  const validateSimplifiedCap = (capData: any): SimplifiedCapInput | null => {
    // validate idName
    if (!capData.idName || typeof capData.idName !== 'string') {
      throw new Error('Missing or invalid idName');
    }
    if (capData.idName.length < 6) {
      throw new Error('idName must be at least 6 characters');
    }
    if (capData.idName.length > 20) {
      throw new Error('idName must be at most 20 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(capData.idName)) {
      throw new Error('idName must contain only letters, numbers, and underscores');
    }

    if (!capData.metadata || typeof capData.metadata !== 'object') {
      throw new Error('Missing metadata');
    }

    // validate displayName
    if (
      !capData.metadata.displayName ||
      typeof capData.metadata.displayName !== 'string'
    ) {
      throw new Error('Missing displayName in metadata');
    }
    if (capData.metadata.displayName.length < 1) {
      throw new Error('Display name is required');
    }
    if (capData.metadata.displayName.length > 50) {
      throw new Error('Display name too long (max 50 characters)');
    }

    // validate description
    if (
      !capData.metadata.description ||
      typeof capData.metadata.description !== 'string'
    ) {
      throw new Error('Missing description in metadata');
    }
    if (capData.metadata.description.length < 20) {
      throw new Error('Description must be at least 20 characters');
    }
    if (capData.metadata.description.length > 500) {
      throw new Error('Description too long (max 500 characters)');
    }

    // validate tags
    if (!capData.metadata.tags || !Array.isArray(capData.metadata.tags)) {
      throw new Error('Missing or invalid tags in metadata');
    }
    if (!capData.metadata.tags.every((tag: any) => typeof tag === 'string')) {
      throw new Error('All tags must be strings');
    }

    // validate optional homepage URL
    if (capData.metadata.homepage && capData.metadata.homepage !== '') {
      try {
        new URL(capData.metadata.homepage);
      } catch {
        throw new Error('Homepage must be a valid URL');
      }
    }

    // validate optional repository URL
    if (capData.metadata.repository && capData.metadata.repository !== '') {
      try {
        new URL(capData.metadata.repository);
      } catch {
        throw new Error('Repository must be a valid URL');
      }
    }

    if (!capData.core || typeof capData.core !== 'object') {
      throw new Error('Missing core');
    }

    if (!capData.core.prompt || typeof capData.core.prompt !== 'object') {
      throw new Error('Missing prompt in core');
    }

    if (
      !capData.core.prompt.value ||
      typeof capData.core.prompt.value !== 'string'
    ) {
      throw new Error('Missing prompt value');
    }

    if (!capData.core.modelId || typeof capData.core.modelId !== 'string') {
      throw new Error('Missing modelId in core');
    }

    // validate model exists
    if (
      !models ||
      !models.find((model) => model.id === capData.core.modelId)
    ) {
      throw new Error(`Model with ID "${capData.core.modelId}" not found`);
    }

    return capData as SimplifiedCapInput;
  };

  // convert simplified input to full Cap object
  const convertToFullCap = (simplifiedCap: SimplifiedCapInput): any => {
    const model = models?.find((m) => m.id === simplifiedCap.core.modelId);
    if (!model) {
      throw new Error(`Model not found: ${simplifiedCap.core.modelId}`);
    }

    return {
      id: `${did}:${simplifiedCap.idName}`,
      authorDID: did,
      idName: simplifiedCap.idName,
      metadata: {
        ...simplifiedCap.metadata,
        submittedAt: Date.now(),
      },
      core: {
        prompt: simplifiedCap.core.prompt,
        model: model,
        mcpServers: simplifiedCap.core.mcpServers || {},
      },
    };
  };

  const handleBatchUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!did) {
      toast.error('Please sign in to upload caps');
      return;
    }

    setUploading(true);
    setParsedData(null);
    setUploadResults({ success: [], errors: [] });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate that it's an array
      if (!Array.isArray(data)) {
        throw new Error('File must contain an array of Cap objects');
      }

      const validCaps: SimplifiedCapInput[] = [];
      const invalidCaps: { cap: any; error: string }[] = [];

      // Validate each cap without creating them yet
      for (let i = 0; i < data.length; i++) {
        const capData = data[i];
        try {
          const validatedCap = validateSimplifiedCap(capData);
          if (validatedCap) {
            validCaps.push(validatedCap);
          }
        } catch (error) {
          let errorMessage = 'Invalid cap format';

          if (error instanceof Error) {
            errorMessage = error.message;
          }

          const capName =
            capData?.metadata?.displayName ||
            capData?.idName ||
            `Item ${i + 1}`;
          invalidCaps.push({
            cap: capData,
            error: `"${capName}": ${errorMessage}`,
          });
        }
      }

      setParsedData({ validCaps, invalidCaps });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to parse JSON file';
      setParsedData({
        validCaps: [],
        invalidCaps: [{ cap: null, error: errorMessage }],
      });
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = async () => {
    if (!parsedData || parsedData.validCaps.length === 0) return;

    setIsCreating(true);

    try {
      const results = {
        success: [] as LocalCap[],
        errors: [] as { cap: any; error: string }[],
      };

      // Create each validated cap
      for (const simplifiedCap of parsedData.validCaps) {
        try {
          const fullCap = convertToFullCap(simplifiedCap);

          // validate full Cap object
          CapSchema.parse(fullCap);

          const newLocalCap = createCap(fullCap);
          results.success.push(newLocalCap);
        } catch (error) {
          const capName =
            simplifiedCap.metadata?.displayName ||
            simplifiedCap.idName ||
            'Unknown Cap';
          results.errors.push({
            cap: simplifiedCap,
            error: `"${capName}": Failed to create cap - ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      setUploadResults(results);

      // If there are successful uploads, call the parent callback
      if (results.success.length > 0 && onBatchCreate) {
        onBatchCreate(results.success);
      }

      // Clear parsed data after creation
      setParsedData(null);
    } catch (error) {
      toast.error('Failed to create caps');
    }

    setIsCreating(false);
  };

  const handleCopyError = async (error: string) => {
    try {
      await navigator.clipboard.writeText(error);
      toast.success('Error message copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const hasResults =
    uploadResults.success.length > 0 || uploadResults.errors.length > 0;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cap-studio')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cap Studio
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Batch Create Caps</h1>
        <p className="text-muted-foreground">
          Upload multiple caps from a JSON file. Each cap will be validated and
          created as a draft in your local workspace.
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload JSON File</CardTitle>
          <CardDescription>
            Select a JSON file containing an array of simplified cap objects.
            The system will automatically fill in required fields like ID,
            authorDID, and submission time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleBatchUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={uploading}
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Processing...' : 'Choose JSON File'}
            </Button>
          </div>

          {/* Format Example */}
          <div className="bg-muted p-4 rounded-lg">
            <button
              type="button"
              onClick={() => setShowJsonFormat(!showJsonFormat)}
              className="flex items-center justify-between w-full text-left font-medium text-sm mb-2 hover:text-foreground transition-colors"
            >
              <span>Expected JSON format (simplified):</span>
              {showJsonFormat ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {showJsonFormat && (
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                {`[
  {
    "idName": "my_awesome_cap",
    "metadata": {
      "displayName": "My Awesome Cap",
      "description": "A detailed description of what this cap does and how it helps users accomplish their tasks effectively",
      "tags": ["productivity", "assistant"],
      "thumbnail": {
        "type": "url",
        "url": "https://example.com/thumbnail.png"
      },
      "homepage": "https://example.com",
      "repository": "https://github.com/user/repo"
    },
    "core": {
      "prompt": {
        "value": "You are a helpful assistant that...",
        "suggestions": ["How can I help you today?", "What would you like to know?"]
      },
      "modelId": "openai/gpt-4o-mini",
      "mcpServers": {
        "server-name": {
          "url": "npm:@example/mcp-server",
          "transport": "httpStream"
        }
      }
    }
  }
]

Validation Rules:
- idName: 6-20 chars, letters/numbers/underscores only (no dashes)
- displayName: 1-50 characters required
- description: 20-500 characters required
- tags: array of strings required
- homepage/repository: valid URLs (optional)
- thumbnail/mcpServers: optional
- prompt.suggestions: optional array

Auto-generated fields:
- id: "authorDID:idName"
- authorDID: from your authentication
- submittedAt: current timestamp`}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Preview</CardTitle>
            <CardDescription>
              Review the caps before creating them. Only valid caps will be
              created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedData.validCaps.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">
                    ✅ {parsedData.validCaps.length} cap(s) ready to create
                  </div>
                  <div className="mt-2 space-y-1">
                    {parsedData.validCaps.map((cap, index) => (
                      <div
                        key={cap.idName || `cap-${index}`}
                        className="text-sm bg-muted p-2 rounded"
                      >
                        "{cap.metadata?.displayName || cap.idName}" (
                        {cap.idName || `Item ${index + 1}`})
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {parsedData.invalidCaps.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-3">
                    ❌ {parsedData.invalidCaps.length} invalid cap(s) found:
                  </div>
                  <div className="space-y-2">
                    {parsedData.invalidCaps.map((error, index) => (
                      <div
                        key={
                          error.cap?.idName || error.cap?.id || `error-${index}`
                        }
                        className="relative bg-muted p-3 rounded font-mono text-sm group"
                      >
                        <div className="pr-8">{error.error}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopyError(error.error)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Confirm button */}
            {parsedData.validCaps.length > 0 && (
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={handleConfirmUpload}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating
                    ? 'Creating Caps...'
                    : `Create ${parsedData.validCaps.length} Cap(s)`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedData(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadResults.success.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">
                    ✅ Successfully created {uploadResults.success.length}{' '}
                    cap(s) as drafts
                  </div>
                  <div className="mt-2 space-y-1">
                    {uploadResults.success.map((cap) => (
                      <div
                        key={cap.id}
                        className="text-sm bg-muted p-2 rounded"
                      >
                        "{cap.capData.metadata.displayName}" (
                        {cap.capData.idName})
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {uploadResults.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-3">
                    ❌ {uploadResults.errors.length} error(s) occurred:
                  </div>
                  <div className="space-y-2">
                    {uploadResults.errors.map((error, index) => (
                      <div
                        key={error.cap?.idName || `error-${index}`}
                        className="relative bg-muted p-3 rounded font-mono text-sm group"
                      >
                        <div className="pr-8">{error.error}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopyError(error.error)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
