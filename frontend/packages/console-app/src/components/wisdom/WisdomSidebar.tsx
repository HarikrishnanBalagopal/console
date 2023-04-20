import * as React from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Card,
  CardBody,
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
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import ReactDiffViewer from 'react-diff-viewer';
import {
  sendFeedbackToWisdom, sendQueryToWisdom, setWisdomCommand, setWisdomCurrentBackendId,
  setWisdomCurrentModelId, setWisdomCurrentTaskId, setWisdomYaml
} from '../../redux/actions/wisdom-actions';
import {
  isWisdomHideAdvancedTab,
  isWisdomLoading,
  isWisdomSendingFeedback,
  selectWisdomAllBackends,
  selectWisdomAnswer,
  selectWisdomCurrentBackendId,
  selectWisdomCurrentEditorYaml,
  selectWisdomCurrentJobProgress,
  selectWisdomCurrentModelId,
  selectWisdomCurrentTaskId,
  selectWisdomError,
  selectWisdomFeedbackError,
} from '../../redux/reducers/wisdom-selectors';
import useCloudShellAvailable from '../cloud-shell/useCloudShellAvailable';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import { WisdomAllBackends, WisdomAnswer, WisdomModel, WisdomModelTask } from './wisdom-types';
import { WISDOM_VERSION } from './wisdom-utils';

import './WisdomSidebar.scss';

type StateProps = {
  activeNamespace: string;
  data?: WisdomAnswer;
  isLoading?: boolean;
  isSendingFeedback?: boolean;
  error?: string;
  feedbackError?: string;
  isCloudShellOpen?: boolean;
  allBackends: WisdomAllBackends;
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
};

export type WisdomSidebarProps = {
  onClose: () => void;
} & StateProps & DispatchProps;

const ALL_NAMESPACES = 'all-namespaces';

const getImportYAMLPath = (activeNamespace: string): string =>
  formatNamespacedRouteForResource('import', activeNamespace);


type MyCodeBlockProps = {
  language: string;
  oldCode: string;
  handleCodeBlockClick: (language: string, code: string, isAppend: boolean) => void;
  handleGoToYamlImportPage: () => boolean;
};

const MyCodeBlock: React.FC<MyCodeBlockProps> = ({ language, oldCode, handleCodeBlockClick, handleGoToYamlImportPage, children, ...props }) => {
  // console.log(`oldCode -------------------------------------\n${oldCode}`);
  const newCode = String(children);
  // console.log('newCode', newCode);
  const [isDiffOpen, setIsDiffOpen] = React.useState(false);
  return (
    <div className="wisdom-code-block-wrapper margin-top-bottom-1em">
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
          <Stack className="wisdom-code-block-corner-buttons">
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

const WisdomSidebar: React.FC<WisdomSidebarProps> = ({
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
}) => {
  const backendArray = Object.values(allBackends);
  const currentBackendModels: Array<WisdomModel> = allBackends[currentBackendId]?.discoveryAnswer.model_data;
  const currentBackendModelTasks: Array<WisdomModelTask> = currentBackendModels?.find(m => m.model_id === currentModelId)?.tasks;
  const currentBackendModelTask: WisdomModelTask | undefined = currentBackendModelTasks?.find(t => String(t.taskId) === currentTaskId);
  // console.log('DEBUG >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  // console.log('allBackends', allBackends);
  // console.log('currentBackendModels', currentBackendModels);
  // console.log('currentBackendModelTasks', currentBackendModelTasks);
  // console.log('currentBackendId', currentBackendId);
  // console.log('currentModelId', currentModelId);
  // console.log('currentTaskId', currentTaskId);
  const [query, setQuery] = React.useState('');
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

  // handleGoToYamlImportPage returns false if we didn't have to navigate
  const handleGoToYamlImportPage = (): boolean => {
    const urlPath = getImportYAMLPath(activeNamespace);
    console.log('location', location, 'urlPath', urlPath);
    if (location.pathname === urlPath) {
      console.log('skipping navigation to import yaml page');
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
    alert('not implemented yet');
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

  // console.log('currentBackendModels', currentBackendModels);
  // console.log('treeData', treeData);

  return (
    <NotificationDrawer translate='no' className="on-top-z-index-301">
      <NotificationDrawerHeader title={"Wisdom Assistant " + WISDOM_VERSION}>
        <Button aria-label="close button" variant="link" onClick={onClose}>
          <TimesIcon />
        </Button>
      </NotificationDrawerHeader>
      <NotificationDrawerBody style={{ padding: '1em' }}>
        <Stack hasGutter>
          <Form ref={formRef} noValidate={false} onSubmit={(e) => e.preventDefault()}>
            <FormGroup isRequired label="A short description of the issue you are facing">
              <TextArea
                isRequired
                aria-label="description of the issue"
                name="description"
                placeholder="I need the YAML for deploying Redis image with 24 replicas."
                value={query}
                onChange={(v) => setQuery(v)}
              />
            </FormGroup>
            {
              backendArray.length === 0 ? (
                <div className='center-text'>
                  <Spinner /> Fetching the list of Wisdom backends...
                </div>
              ) : hideAdvancedTab ? (
                <div>Wisdom backends loaded.</div>
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
                        name="wisdom-backend"
                        aria-label="selected wisdom backend">
                        {backendArray.map((e) => <SelectOption key={e.id} value={e.id}>{e.id}</SelectOption>)}
                      </Select>
                    </FormGroup><br />
                    {
                      currentBackendId && currentBackendModels?.length > 0 ? (
                        <>
                          <FormGroup isRequired label="Select the model to use">
                            <div>
                              {currentModelId && <div>The selected model is &apos;{currentBackendModels.find(m => m.model_id === currentModelId)?.model_path}&apos;</div>}
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
                                  <Select
                                    variant={SelectVariant.single}
                                    isOpen={taskSelectOpen}
                                    onToggle={() => setTaskSelectOpen(!taskSelectOpen)}
                                    selections={currentTaskId}
                                    onSelect={(_, s) => { setBackendModelTask(s.toString()); setTaskSelectOpen(false); }}
                                    name="wisdom-task"
                                    aria-label="selected wisdom task">
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
                                        name="wisdom-task-example"
                                        aria-label="example prompts for the selected wisdom task">
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
  data: selectWisdomAnswer(state),
  isLoading: isWisdomLoading(state),
  isSendingFeedback: isWisdomSendingFeedback(state),
  error: selectWisdomError(state),
  feedbackError: selectWisdomFeedbackError(state),
  isCloudShellOpen: isCloudShellExpanded(state),
  allBackends: selectWisdomAllBackends(state),
  currentBackendId: selectWisdomCurrentBackendId(state),
  currentModelId: selectWisdomCurrentModelId(state),
  currentTaskId: selectWisdomCurrentTaskId(state),
  currentJobProgress: selectWisdomCurrentJobProgress(state),
  currentEditorYaml: selectWisdomCurrentEditorYaml(state),
  hideAdvancedTab: isWisdomHideAdvancedTab(state),
});

const dispatchToProps = (dispatch): DispatchProps => ({
  sendQuery: (query) => dispatch(sendQueryToWisdom(query)),
  sendFeedback: (good) => dispatch(sendFeedbackToWisdom(good)),
  setYaml: (yaml, isAppend) => dispatch(setWisdomYaml(yaml, isAppend)),
  setCommand: (command) => dispatch(setWisdomCommand(command)),
  openCloudshell: () => dispatch(toggleCloudShellExpanded()),
  setBackend: (id: string) => { console.log('setting backend to:', id); dispatch(setWisdomCurrentBackendId(id)); },
  setBackendModel: (id: string) => { console.log('setting backend model to:', id); dispatch(setWisdomCurrentModelId(id)); },
  setBackendModelTask: (id: string) => { console.log('setting backend model task to:', id); dispatch(setWisdomCurrentTaskId(id)); },
});

export default connect<StateProps, DispatchProps>(stateToProps, dispatchToProps)(WisdomSidebar);
