import * as React from 'react';
import {
  ActionGroup,
  Alert,
  AlertVariant,
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  ExpandableSection,
  Form,
  FormGroup,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  Progress,
  ProgressSize,
  Select,
  SelectOption,
  SelectVariant,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
  TextArea,
  TreeView,
  TreeViewDataItem,
} from '@patternfly/react-core';
import { TimesIcon, PlusCircleIcon, PencilAltIcon, ThumbsUpIcon, ThumbsDownIcon } from '@patternfly/react-icons';
import ReactMarkdown from 'react-markdown';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { xonokai } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { RootState } from '@console/internal/redux';
import { useToast } from '@console/shared/src/components/toast';
import ReactDiffViewer from 'react-diff-viewer';
import {
  sendFeedbackToAssistant, sendQueryToAssistant, setAssistantCommand, setAssistantCurrentBackendId,
  setAssistantCurrentModelId, setAssistantCurrentTaskId, setAssistantHideAdvancedTab, setAssistantYaml,
} from '../../redux/actions/assistant-actions';
import {
  isAssistantHideAdvancedTab,
  isAssistantLoading,
  isAssistantSendingFeedback,
  selectAssistantAllBackends,
  selectAssistantAnswer,
  selectAssistantCurrentBackendId,
  selectAssistantCurrentEditorYaml,
  selectAssistantCurrentJobProgress,
  selectAssistantCurrentModelId,
  selectAssistantCurrentTaskId,
  selectAssistantError,
  selectAssistantFeedbackError,
} from '../../redux/reducers/assistant-selectors';
import useCloudShellAvailable from '../cloud-shell/useCloudShellAvailable';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import { AssistantAllBackends, AssistantAnswer, AssistantModel, AssistantModelTask } from './assistant-types';
import { ASSISTANT_VERSION } from './assistant-utils';
import { getImportYAMLPath, useOnYamlEditPage } from './useOnYamlEditPage';

import './AssistantSidebar.scss';

type StateProps = {
  activeNamespace: string;
  data?: AssistantAnswer;
  isLoading?: boolean;
  isSendingFeedback?: boolean;
  error?: string;
  feedbackError?: string;
  isCloudShellOpen?: boolean;
  allBackends: AssistantAllBackends;
  currentBackendId?: string;
  currentModelId?: string;
  currentTaskId?: string;
  currentJobProgress?: number;
  currentEditorYaml?: string;
  hideAdvancedTab?: boolean;
};

type DispatchProps = {
  sendQuery: (query: string) => void;
  sendFeedback: (good: boolean) => void;
  setYaml: (yaml: string, isAppend: boolean) => void;
  setCommand: (command: string) => void;
  openCloudshell: () => void;
  setBackend: (id: string) => void;
  setBackendModel: (id: string) => void;
  setBackendModelTask: (id: string) => void;
  setHideAdvancedTab: (hide: boolean) => void;
};

export type AssistantSidebarProps = {
  onClose: () => void;
} & StateProps & DispatchProps;

const ALL_NAMESPACES = 'all-namespaces';

type MyCodeBlockProps = {
  language: string;
  oldCode: string;
  handleCodeBlockClick: (language: string, code: string, isAppend: boolean) => void;
  handleGoToYamlImportPage: () => boolean;
};

const MyCodeBlock: React.FC<MyCodeBlockProps> = ({ language, oldCode, handleCodeBlockClick, handleGoToYamlImportPage, children, ...props }) => {
  // console.log(`oldCode -------------------------------------\n${oldCode}`);
  // if(Array.isArray(children) && children.length > 0 && typeof children[0] === 'string' && children[0] !== '') {
  //   console.log('DEBUG in here!!!!!!!!!!!!!', children);
  // }
  const newCode = String(children);
  // console.log('newCode', newCode);
  const [isDiffOpen, setIsDiffOpen] = React.useState(false);
  return (
    <div className="assistant-code-block-wrapper margin-top-bottom-1em">
      {isDiffOpen ? (
        <>
          <ReactDiffViewer oldValue={oldCode ?? ''} newValue={newCode} splitView={false} useDarkTheme={true} showDiffOnly={true} />
          <div className='flex flex-gap-1em padding-1em'>
            <Button variant='danger' onClick={() => {
              setIsDiffOpen(false);
              handleCodeBlockClick(language, newCode, false);
            }}>Replace</Button>
            <Button variant='link' onClick={() => {
              setIsDiffOpen(false);
            }}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <SyntaxHighlighter style={xonokai} language={language} {...props}>
            {children}
          </SyntaxHighlighter>
          <Stack className="assistant-code-block-corner-buttons">
            {language === 'yaml' && oldCode && (
              <StackItem>
                <Button
                  variant="link"
                  title="replace the existing code with this code"
                  onClick={() => {
                    setIsDiffOpen(true);
                  }}
                >
                  <PencilAltIcon />
                </Button>
              </StackItem>
            )}
            <StackItem>
              <Button
                variant="link"
                title="append this code to the existing code"
                onClick={() => {
                  handleCodeBlockClick(language, newCode, true);
                }}
              >
                <PlusCircleIcon />
              </Button>
            </StackItem>
          </Stack>
        </>
      )}
    </div>
  );
};

const AssistantSidebar: React.FC<AssistantSidebarProps> = ({
  activeNamespace,
  data,
  isLoading,
  isSendingFeedback,
  error,
  feedbackError,
  isCloudShellOpen,
  allBackends,
  currentBackendId,
  currentModelId,
  currentTaskId,
  currentJobProgress,
  currentEditorYaml,
  hideAdvancedTab,
  onClose,
  openCloudshell,
  sendQuery,
  sendFeedback,
  setYaml,
  setCommand,
  setBackend,
  setBackendModel,
  setBackendModelTask,
  setHideAdvancedTab,
}) => {
  const backendArray = Object.values(allBackends);
  const currentBackendModels: Array<AssistantModel> = allBackends[currentBackendId]?.discoveryAnswer.model_data;
  const currentBackendModelTasks: Array<AssistantModelTask> = currentBackendModels?.find(m => m.model_id === currentModelId)?.tasks;
  const currentBackendModelTask: AssistantModelTask | undefined = currentBackendModelTasks?.find(t => String(t.taskId) === currentTaskId);

  const [query, setQuery] = React.useState('');
  const [changeTaskBasedOnCurrentPage, setChangeTaskBasedOnCurrentPage] = React.useState(true);
  const [endpointSelectOpen, setEndpointSelectOpen] = React.useState(false);
  const [modelSelectOpen, setModelSelectOpen] = React.useState(false);
  const [taskSelectOpen, setTaskSelectOpen] = React.useState(false);
  const [taskExampleSelectOpen, setTaskExampleSelectOpen] = React.useState(false);
  const [isFeedbackSent, setIsFeedbackSent] = React.useState(false);
  const [activeItems, setActiveItems] = React.useState<Array<TreeViewDataItem>>([]);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const history = useHistory();
  const location = useLocation();
  const terminalAvailable = useCloudShellAvailable();
  const onYamlEditPage = useOnYamlEditPage(activeNamespace);
  const toastContext = useToast();

  // handleGoToYamlImportPage returns false if we didn't have to navigate
  const handleGoToYamlImportPage = (): boolean => {
    const urlPath = getImportYAMLPath(activeNamespace);
    console.log('location', location, 'urlPath', urlPath);
    if (onYamlEditPage) {
      console.log('skipping navigation to the import yaml page');
      return false;
    }
    console.log('navigating to import yaml page');
    history.push(urlPath);
    return true;
  };

  const handleCodeBlockClick = (language: string, code: string, isAppend: boolean) => {
    if (language === 'yaml') {
      setYaml(code, isAppend);
      handleGoToYamlImportPage();
      return;
    }
    if (language === 'console' || language === 'bash') {
      if (!terminalAvailable) {
        console.log('cloud shell/terminal is not available');
        toastContext.addToast({
          variant: AlertVariant.danger,
          title: 'Terminal is not available',
          content: (<div>
            The cloud shell/terminal is not available.
            See <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.openshift.com/container-platform/4.12/web_console/odc-about-web-terminal.html"
            >
              About the web terminal in the web console
            </a> for more information.
          </div>),
          timeout: true,
          dismissible: true,
        });
        return;
      }
      setCommand(code);
      if (isCloudShellOpen) {
        console.log('skipping opening the web terminal');
      } else {
        console.log('opening the web terminal');
        openCloudshell();
      }
      return;
    }
    toastContext.addToast({
      variant: AlertVariant.danger,
      title: 'Not implemented yet',
      content: `Support for handling '${language}' has not been implemented yet`,
      timeout: true,
      dismissible: true,
    });
  };

  const treeData: TreeViewDataItem = { 'id': 'models', 'name': 'models' };
  currentBackendModels?.forEach(model => {
    let currTreeNode: TreeViewDataItem = treeData;
    const parts = model.model_path.split('/').filter(s => s.length > 0);
    parts.forEach((part, i) => {
      if (!currTreeNode.children) currTreeNode.children = [];
      const childNode = currTreeNode.children.find(c => c.name === part);
      if (childNode) {
        currTreeNode = childNode;
        return;
      }
      const t1 = { 'id': i === parts.length - 1 ? model.model_id : part, 'name': part };
      currTreeNode.children.push(t1);
      currTreeNode = t1;
    });
  });

  React.useEffect(() => {
    if (!currentBackendModels || !currentModelId) {
      setActiveItems([]);
      return;
    }
    const model = currentBackendModels.find(m => m.model_id === currentModelId);
    if (!model) {
      setActiveItems([]);
      return;
    }
    const parts = model.model_path.split('/').filter(s => s.length > 0);
    const part = parts.length > 0 ? parts[parts.length - 1] : currentModelId;
    setActiveItems([{ 'id': currentModelId, 'name': part }]);
  }, [JSON.stringify(currentBackendModels), currentModelId]);

  React.useEffect(() => {
    // console.log('changeTaskBasedOnCurrentPage', changeTaskBasedOnCurrentPage, 'onYamlEditPage', onYamlEditPage);
    if (!changeTaskBasedOnCurrentPage) return;
    if (onYamlEditPage) {
      if (currentTaskId !== '3') {
        console.log('Changing the task to NL2Yaml (task 3) since we are on a YAML edit page');
        setBackendModelTask('3');
      }
    } else {
      if (currentTaskId !== '4') {
        console.log('Changing the task back to NL2Answer (task 4) since we are no longer on a YAML edit page');
        setBackendModelTask('4');
      }
    }
  }, [onYamlEditPage, changeTaskBasedOnCurrentPage, location.pathname, currentTaskId]);

  return (
    <NotificationDrawer translate='no' className="on-top-z-index-301">
      <NotificationDrawerHeader title={"Assistant " + ASSISTANT_VERSION}>
        <Button aria-label="close button" variant="link" onClick={onClose}>
          <TimesIcon />
        </Button>
      </NotificationDrawerHeader>
      <NotificationDrawerBody style={{ padding: '1em' }}
        tabIndex={-1}
        onKeyUp={e => {
          console.log(e.key);
          if (e.key === 'Alt') {
            console.log("The 'Alt' key was pressed, and toggling the advanced menu...");
            setHideAdvancedTab(!hideAdvancedTab);
          }
        }}
      >
        <Stack hasGutter>
          <Form ref={formRef} noValidate={false} onSubmit={(e) => e.preventDefault()}>
            <FormGroup isRequired label="A short description of the issue you are facing">
              <TextArea
                isRequired
                aria-label="description of the issue"
                name="description"
                placeholder="I need the YAML for deploying Redis image with 2 replicas."
                value={query}
                rows={5}
                onChange={(v) => setQuery(v)}
              />
            </FormGroup>
            {
              backendArray.length === 0 ? (
                <div className='center-text'>
                  <Spinner /> Fetching the list of Assistant backends...
                </div>
              ) : hideAdvancedTab ? (
                null
              ) : (
                <ExpandableSection toggleText='Advanced'>
                  <div className='max-width-30em'>
                    <FormGroup isRequired label="Select the backend to use">
                      <Select
                        variant={SelectVariant.single}
                        isOpen={endpointSelectOpen}
                        onToggle={() => setEndpointSelectOpen(!endpointSelectOpen)}
                        selections={currentBackendId}
                        onSelect={(_, s) => { setBackend(s.toString()); setEndpointSelectOpen(false); }}
                        name="assistant-backend"
                        aria-label="selected assistant backend">
                        {backendArray.map((e) => <SelectOption key={e.id} value={e.id}>{e.name}</SelectOption>)}
                      </Select>
                    </FormGroup><br />
                    {
                      currentBackendId && currentBackendModels?.length > 0 ? (
                        <>
                          <FormGroup isRequired label="Select the model to use">
                            <div>
                              {currentModelId && <div>The selected model is
                                <Card isFlat isRounded><CardBody>{currentBackendModels.find(m => m.model_id === currentModelId)?.model_path}</CardBody></Card></div>}
                              <Button variant="link" onClick={() => setModelSelectOpen(!modelSelectOpen)}>
                                {modelSelectOpen && 'Collapse all'}
                                {!modelSelectOpen && 'Expand all'}
                              </Button>
                              <TreeView
                                id="model-select-tree-view"
                                allExpanded={modelSelectOpen}
                                data={[treeData]}
                                activeItems={activeItems}
                                onSelect={(_, t) => {
                                  if (t && !t.children) {
                                    setActiveItems([t]);
                                    setBackendModel(t.id ?? '');
                                    setModelSelectOpen(false);
                                  }
                                }} />
                            </div>
                          </FormGroup><br />
                          {
                            currentModelId && currentBackendModelTasks?.length > 0 ? (
                              <>
                                <FormGroup isRequired label="Select the task to use">
                                  <Checkbox
                                    label="Select the task automatically based on the current page"
                                    isChecked={changeTaskBasedOnCurrentPage}
                                    onChange={(checked) => setChangeTaskBasedOnCurrentPage(checked)}
                                    id="checkbox-change-task-based-on-current-page"
                                    name="checkbox-change-task-based-on-current-page"
                                    aria-label="change task based on the current page"
                                  /><br />
                                  <Select
                                    variant={SelectVariant.single}
                                    isOpen={taskSelectOpen}
                                    isDisabled={changeTaskBasedOnCurrentPage}
                                    onToggle={() => setTaskSelectOpen(!taskSelectOpen)}
                                    selections={currentTaskId}
                                    onSelect={(_, s) => { setBackendModelTask(s.toString()); setTaskSelectOpen(false); }}
                                    name="assistant-task"
                                    aria-label="selected assistant task">
                                    {currentBackendModelTasks.map((e) => <SelectOption key={e.taskId} value={e.taskId}>{e.taskTitle}</SelectOption>)}
                                  </Select>
                                </FormGroup><br />
                                {
                                  currentTaskId && currentBackendModelTask ? (
                                    <FormGroup label="Select an example prompt to use">
                                      <Select
                                        variant={SelectVariant.single}
                                        isOpen={taskExampleSelectOpen}
                                        onToggle={() => setTaskExampleSelectOpen(!taskExampleSelectOpen)}
                                        onSelect={(_, s) => { setQuery(s.toString()); setTaskExampleSelectOpen(false); }}
                                        placeholderText="Some example prompts you can try"
                                        name="assistant-task-example"
                                        aria-label="example prompts for the selected assistant task">
                                        {currentBackendModelTask.examples?.map((e, i) => <SelectOption key={i + 1} value={e.text}>{e.text}</SelectOption>)}
                                      </Select>
                                    </FormGroup>
                                  ) : null
                                }
                              </>
                            ) : null
                          }
                        </>
                      ) : null
                    }
                  </div>
                </ExpandableSection>
              )
            }
            <ActionGroup>
              <Button isDisabled={isLoading} onClick={() => {
                if (formRef.current && !formRef.current.reportValidity()) return;
                sendQuery(currentEditorYaml ? '```\n' + currentEditorYaml + '```\n' + query : query);
                setIsFeedbackSent(false);
              }} type="submit">Submit</Button>
            </ActionGroup>
          </Form>
          <Divider className="margin-top-bottom-1em" />
          <Card>
            <CardBody className="overflow-x-scroll">
              {error ? (
                <Alert variant="danger" title={error} />
              ) : isLoading ? (
                <>
                  {currentJobProgress >= 0 && (<>
                    <Progress
                      value={currentJobProgress}
                      measureLocation="none"
                      size={ProgressSize.sm}
                      aria-label="time elapsed waiting for the assistant" />
                    <br />
                  </>)}
                  <Spinner />
                </>
              ) : data ? (
                <div>
                  <ReactMarkdown
                    components={{
                      'code': ({ node, inline, className, children, ...props }) => {
                        // console.log('DEBUG >>>>>>>>>>>>> className', className, 'children', JSON.stringify(children));
                        const match = /language-(\w+)/.exec(className ?? '');
                        return !inline && match && match.length >= 2 ? (
                          <MyCodeBlock
                            oldCode={currentEditorYaml}
                            language={match[1]}
                            handleCodeBlockClick={handleCodeBlockClick}
                            handleGoToYamlImportPage={handleGoToYamlImportPage}
                            {...props}
                          >
                            {children}
                          </MyCodeBlock>
                        ) : !inline && className === undefined ? (
                          <MyCodeBlock
                            oldCode={currentEditorYaml}
                            language={'console'}
                            handleCodeBlockClick={handleCodeBlockClick}
                            handleGoToYamlImportPage={handleGoToYamlImportPage}
                            {...props}
                          >
                            {children}
                          </MyCodeBlock>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {data.task_output}
                  </ReactMarkdown>
                  <Divider className="margin-top-bottom-1em" />
                  {feedbackError ? (
                    <Alert variant="danger" title={feedbackError} />
                  ) : isSendingFeedback ? (
                    <Spinner size="lg" />
                  ) : isFeedbackSent ? (
                    <span>Thanks for submitting the feedback! It will be used to improve the assistant.</span>
                  ) : (
                    <Split hasGutter className='align-flex-end'>
                      <SplitItem>
                        <Button onClick={() => { setIsFeedbackSent(true); sendFeedback(true); }}><ThumbsUpIcon /></Button>
                      </SplitItem>
                      <SplitItem>
                        <Button onClick={() => { setIsFeedbackSent(true); sendFeedback(false); }}><ThumbsDownIcon /></Button>
                      </SplitItem>
                    </Split>
                  )}
                </div>
              ) : null}
            </CardBody>
          </Card>
        </Stack>
      </NotificationDrawerBody>
    </NotificationDrawer>
  );
};

const stateToProps = (state: RootState): StateProps => ({
  activeNamespace: state.UI.get('activeNamespace', ALL_NAMESPACES),
  data: selectAssistantAnswer(state),
  isLoading: isAssistantLoading(state),
  isSendingFeedback: isAssistantSendingFeedback(state),
  error: selectAssistantError(state),
  feedbackError: selectAssistantFeedbackError(state),
  isCloudShellOpen: isCloudShellExpanded(state),
  allBackends: selectAssistantAllBackends(state),
  currentBackendId: selectAssistantCurrentBackendId(state),
  currentModelId: selectAssistantCurrentModelId(state),
  currentTaskId: selectAssistantCurrentTaskId(state),
  currentJobProgress: selectAssistantCurrentJobProgress(state),
  currentEditorYaml: selectAssistantCurrentEditorYaml(state),
  hideAdvancedTab: isAssistantHideAdvancedTab(state),
});

const dispatchToProps = (dispatch): DispatchProps => ({
  sendQuery: (query) => dispatch(sendQueryToAssistant(query)),
  sendFeedback: (good) => dispatch(sendFeedbackToAssistant(good)),
  setYaml: (yaml, isAppend) => dispatch(setAssistantYaml(yaml, isAppend)),
  setCommand: (command) => dispatch(setAssistantCommand(command)),
  openCloudshell: () => dispatch(toggleCloudShellExpanded()),
  setBackend: (id: string) => { console.log('setting backend to:', id); dispatch(setAssistantCurrentBackendId(id)); },
  setBackendModel: (id: string) => { console.log('setting backend model to:', id); dispatch(setAssistantCurrentModelId(id)); },
  setBackendModelTask: (id: string) => { console.log('setting backend model task to:', id); dispatch(setAssistantCurrentTaskId(id)); },
  setHideAdvancedTab: (hide: boolean) => { console.log('setting the hideAdvancedTab to:', hide); dispatch(setAssistantHideAdvancedTab(hide)); },
});

export default connect<StateProps, DispatchProps>(stateToProps, dispatchToProps)(AssistantSidebar);
