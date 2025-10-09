import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import type React from 'react';
import type { ModelDetails } from '@/features/cap-studio/components/cap-edit/model/model-selector/type';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useLocale } from '@/shared/locales/use-locale';
import { cn } from '@/shared/utils';
import { ProviderAvatar } from '../../../../../../shared/components/provider-avatar';
import { getModelName, getProviderName } from './utils';

interface ModelCardProps {
  model: ModelDetails;
  onClick: (model: ModelDetails) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onClick }) => {
  const { t } = useLocale();

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card
        className={cn(
          'hover:bg-accent transition-colors cursor-pointer h-full',
        )}
        onClick={() => onClick(model)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <ProviderAvatar provider={model.providerName} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {getModelName(model)}
                  </CardTitle>
                  {model.supports_tools && (
                    <Badge variant="secondary" className="text-xs">
                      <Wrench className="h-3 w-3 mr-1" />
                      Tools
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getProviderName(model)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardFooter className=" flex flex-col items-start pt-0 space-y-2">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>
              ${Number(model.pricing.input_per_million_tokens.toPrecision(3))}{' '}
              {t('aiProvider.modelCard.pricing.inputTokens')}
            </span>
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>
              ${Number(model.pricing.output_per_million_tokens.toPrecision(3))}{' '}
              {t('aiProvider.modelCard.pricing.outputTokens')}
            </span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
