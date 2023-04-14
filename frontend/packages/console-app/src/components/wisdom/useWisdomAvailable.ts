import * as React from 'react';
import { useFlag } from '@console/shared';
import { FLAG_V1ALPHA2WISDOM } from '../../consts';
import { checkWisdomAvailable } from './wisdom-utils';

const useWisdomAvailable = () => {
  const [wisdomAvailable, setWisdomAvailable] = React.useState(false);
  const flagEnabled = useFlag(FLAG_V1ALPHA2WISDOM);
  React.useEffect(() => {
    let mounted = true;
    if (flagEnabled) {
      checkWisdomAvailable()
        .then(() => {
          if (mounted) {
            setWisdomAvailable(true);
          }
        })
        .catch(() => {
          if (mounted) {
            setWisdomAvailable(false);
          }
        });
    } else {
      setWisdomAvailable(false);
    }
    return () => {
      mounted = false;
    };
  }, [flagEnabled]);

  return flagEnabled && wisdomAvailable;
};

export default useWisdomAvailable;
