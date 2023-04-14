import * as React from 'react';
import { Button, PageHeaderToolsItem } from '@patternfly/react-core';
// import { TerminalIcon } from '@patternfly/react-icons';
// import { useTranslation } from 'react-i18next';
// import { connect } from 'react-redux';
// import { RootState } from '@console/internal/redux';
// import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import isMultiClusterEnabled from '../../utils/isMultiClusterEnabled';
import { RedHatIcon } from './RedHatIcon';
import useWisdomAvailable from './useWisdomAvailable';
import { initializeWisdom } from '../../redux/actions/wisdom-actions';
import { useDispatch } from 'react-redux';
// import { useWisdomPrompt } from './wisdom-utils';
// import { setWisdomExpanded } from '../../redux/actions/wisdom-actions';
// import { isWisdomExpanded } from '../../redux/reducers/wisdom-selectors';

type Props = {
  isWisdomOpen: boolean;
  onWisdomToggle: () => void;
}

const WisdomMastheadButton: React.FC<Props> = ({ isWisdomOpen, onWisdomToggle }) => {
  const wisdomAvailable = useWisdomAvailable();
  // const { data, isLoading, error } = useWisdomPrompt('yaml for deploying redis image with 24 replicas');
  // const fireTelemetryEvent = useTelemetry();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (wisdomAvailable) {
      dispatch(initializeWisdom());
    }
  }, [wisdomAvailable]);

  // const { t } = useTranslation();

  if (!wisdomAvailable || isMultiClusterEnabled()) {
    return null;
  }

  const openWisdom = () => {
    onWisdomToggle();
    // fireTelemetryEvent('Wisdom Initiated');
  };

  return (
    <PageHeaderToolsItem>
      <Button
        variant="plain"
        aria-label="Wisdom assistant"
        onClick={openWisdom}
        className={isWisdomOpen ? 'pf-m-selected' : undefined}
        data-tour-id="tour-cloud-shell-button"
        data-quickstart-id="qs-masthead-cloudshell"
      >
        <RedHatIcon className="co-masthead-icon" />
      </Button>
    </PageHeaderToolsItem>
  );
};

export default WisdomMastheadButton;
