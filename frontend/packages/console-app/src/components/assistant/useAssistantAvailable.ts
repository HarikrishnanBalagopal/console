import * as React from 'react';
import { useFlag } from '@console/shared';
import { FLAG_V1ALPHA4ASSISTANT } from '../../consts';
import { checkAssistantAvailable } from './assistant-utils';

const useAssistantAvailable = () => {
  const [assistantAvailable, setAssistantAvailable] = React.useState(false);
  const flagEnabled = useFlag(FLAG_V1ALPHA4ASSISTANT);
  React.useEffect(() => {
    let mounted = true;
    if (flagEnabled) {
      checkAssistantAvailable()
        .then(() => {
          if (mounted) {
            setAssistantAvailable(true);
          }
        })
        .catch(() => {
          if (mounted) {
            setAssistantAvailable(false);
          }
        });
    } else {
      setAssistantAvailable(false);
    }
    return () => {
      mounted = false;
    };
  }, [flagEnabled]);

  return flagEnabled && assistantAvailable;
};

export default useAssistantAvailable;
