import * as React from 'react';
import { Button, PageHeaderToolsItem } from '@patternfly/react-core';
import isMultiClusterEnabled from '../../utils/isMultiClusterEnabled';
import { RedHatIcon } from './RedHatIcon';
import useAssistantAvailable from './useAssistantAvailable';
import { initializeAssistant } from '../../redux/actions/assistant-actions';
import { useDispatch } from 'react-redux';

type Props = {
  isAssistantOpen: boolean;
  onAssistantToggle: () => void;
}

const AssistantMastheadButton: React.FC<Props> = ({ isAssistantOpen, onAssistantToggle }) => {
  const assistantAvailable = useAssistantAvailable();
  // const fireTelemetryEvent = useTelemetry();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (assistantAvailable) {
      dispatch(initializeAssistant());
    }
  }, [assistantAvailable]);

  // const { t } = useTranslation();

  if (!assistantAvailable || isMultiClusterEnabled()) {
    return null;
  }

  const openAssistant = () => {
    onAssistantToggle();
    // fireTelemetryEvent('Assistant Initiated');
  };

  return (
    <PageHeaderToolsItem>
      <Button
        variant="plain"
        aria-label="Open the Assistant sidebar"
        onClick={openAssistant}
        className={isAssistantOpen ? 'pf-m-selected' : undefined}
        data-tour-id="tour-cloud-shell-button"
        data-quickstart-id="qs-masthead-cloudshell"
      >
        <RedHatIcon className="co-masthead-icon" />
      </Button>
    </PageHeaderToolsItem>
  );
};

export default AssistantMastheadButton;
