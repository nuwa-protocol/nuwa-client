import { Badge } from '@/shared/components/ui/badge';
import type { CapModel } from '@/shared/types/cap';
import { getModelName, getProviderName } from '../../utils';
import { ProviderAvatar } from '../model-selector/provider-avatar';

interface ModelDetailsProps {
  model: CapModel;
}

export function ModelDetails({ model }: ModelDetailsProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/10">
      <ProviderAvatar provider={model.providerName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base truncate">
          {getModelName(model)}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {getProviderName(model)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Context window: {model.contextLength?.toLocaleString() || 'Unknown'}{' '}
          tokens
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Pricing: ${model.pricing.input_per_million_tokens}/1M input, $
          {model.pricing.output_per_million_tokens}/1M output
        </div>
        {model.supported_parameters &&
          model.supported_parameters.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1">
                Supported parameters:
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {model.supported_parameters.map((param) => (
                  <Badge key={param} variant="outline" className="text-xs">
                    {param}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        {model.supported_inputs && model.supported_inputs.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-1">
              Supported inputs:
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {model.supported_inputs.map((input) => (
                <Badge key={input} variant="outline" className="text-xs">
                  {input}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
