import { AssistantAllBackends, AssistantAnswer } from '../../components/assistant/assistant-types';
import { ASSISTANT_DEFAULT_TASK_TITLE } from '../../components/assistant/assistant-utils';
import { AssistantActions, Actions } from '../actions/assistant-actions';

type State = {
  isExpanded: boolean;
  hideAdvancedTab: boolean;
  isFetchingBackends: boolean;
  isFetchingBackendsPartial: boolean;
  isLoading: boolean;
  isSendingFeedback: boolean;
  fetchingBackendsError: string | undefined;
  error: string | undefined;
  feedbackError: string | undefined;
  answer: AssistantAnswer | undefined;
  yaml: string | undefined;
  yamlIsAppend: boolean;
  command: string | undefined;
  allBackends: AssistantAllBackends;
  defaultBackendId: string | undefined;
  currentBackendId: string | undefined;
  currentModelId: string | undefined;
  currentTaskId: string | undefined;
  currentJobId: string | undefined;
  currentJobProgress: number;
  currentEditorYaml: string | undefined;
};

const initialState: State = {
  isExpanded: false,
  hideAdvancedTab: false,
  isFetchingBackends: false,
  isFetchingBackendsPartial: false,
  isLoading: false,
  isSendingFeedback: false,
  fetchingBackendsError: undefined,
  error: undefined,
  feedbackError: undefined,
  answer: undefined,
  yaml: undefined,
  yamlIsAppend: false,
  command: undefined,
  defaultBackendId: undefined,
  currentBackendId: undefined,
  currentModelId: undefined,
  currentTaskId: undefined,
  currentJobId: undefined,
  currentJobProgress: -1,
  currentEditorYaml: undefined,
  allBackends: {},
};

export default (state = initialState, action: AssistantActions): State => {
  switch (action.type) {
    case Actions.SetAssistantExpanded:
      return {
        ...state,
        isExpanded: action.payload.isExpanded,
      };
    case Actions.SetAssistantHideAdvancedTab:
      return {
        ...state,
        hideAdvancedTab: action.payload.hideAdvancedTab,
      };
    case Actions.SetAssistantFetchingBackends:
      return {
        ...state,
        isFetchingBackends: action.payload.isFetchingBackends,
      };
    case Actions.SetAssistantFetchingBackendsPartial:
      return {
        ...state,
        isFetchingBackendsPartial: action.payload.isFetchingBackendsPartial,
      };
    case Actions.SetAssistantLoading:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
    case Actions.SetAssistantSendingFeedback:
      return {
        ...state,
        isSendingFeedback: action.payload.sendingFeedback,
      };
    case Actions.SetAssistantFetchingBackendsError:
      return {
        ...state,
        fetchingBackendsError: action.payload.fetchingBackendsError,
      };
    case Actions.SetAssistantError:
      return {
        ...state,
        error: action.payload.error,
      };
    case Actions.SetAssistantFeedbackError:
      return {
        ...state,
        feedbackError: action.payload.feedbackError,
      };
    case Actions.SetAssistantAnswer:
      return {
        ...state,
        answer: action.payload.answer,
      };
    case Actions.SetAssistantYaml:
      return {
        ...state,
        yaml: action.payload.yaml,
        yamlIsAppend: action.payload.isAppend,
      };
    case Actions.SetAssistantCommand:
      return {
        ...state,
        command: action.payload.command,
      };
    case Actions.SetCurrentEditorYaml:
      return {
        ...state,
        currentEditorYaml: action.payload.yaml,
      };
    case Actions.SetAssistantCurrentJobId:
      return {
        ...state,
        currentJobId: action.payload.jobId,
      };
    case Actions.SetAssistantCurrentJobProgress:
      return {
        ...state,
        currentJobProgress: action.payload.jobProgress,
      };
    case Actions.SetAssistantDefaultBackendId:
      return {
        ...state,
        defaultBackendId: action.payload.defaultBackendId,
      };
    case Actions.SetAssistantCurrentBackendId: {
      const currentBackendId = action.payload.backendId;
      const currentBackend = state.allBackends[currentBackendId];
      let currentModel = currentBackend?.discoveryAnswer.model_data[0];
      {
        if (currentModel && currentBackend.defaultModelId) {
          const ms = currentBackend?.discoveryAnswer.model_data ?? [];
          const found = ms.find(m => m.model_id === currentBackend.defaultModelId);
          if (found) {
            currentModel = found;
          }
        }
      }
      const currentModelId = currentModel?.model_id;
      let currentTaskIdNum = currentModel?.tasks[0]?.taskId;
      {
        // TODO: temporarily hardcode a default model task
        if (currentTaskIdNum) {
          const ms = currentModel?.tasks ?? [];
          const found = ms.find(m => m.taskTitle === ASSISTANT_DEFAULT_TASK_TITLE);
          if (found) {
            currentTaskIdNum = found.taskId;
          }
        }
      }
      const currentTaskId = currentTaskIdNum === undefined ? undefined : String(currentTaskIdNum);
      return {
        ...state,
        currentBackendId,
        currentModelId,
        currentTaskId,
      };
    }
    case Actions.SetAssistantCurrentModelId: {
      if (state.currentBackendId === undefined) {
        return state;
      }
      const currentBackend = state.allBackends[state.currentBackendId];
      const currentModel = currentBackend?.discoveryAnswer.model_data.find(m => m.model_id === action.payload.modelId);
      const currentModelId = currentModel?.model_id;
      let currentTaskIdNum = currentModel?.tasks[0]?.taskId;
      {
        // TODO: temporarily hardcode a default model task
        if (currentTaskIdNum) {
          const ms = currentModel?.tasks ?? [];
          const found = ms.find(m => m.taskTitle === ASSISTANT_DEFAULT_TASK_TITLE);
          if (found) {
            currentTaskIdNum = found.taskId;
          }
        }
      }
      const currentTaskId = currentTaskIdNum === undefined ? undefined : String(currentTaskIdNum);
      return {
        ...state,
        currentModelId,
        currentTaskId,
      };
    }
    case Actions.SetAssistantCurrentTaskId: {
      if (state.currentBackendId === undefined || state.currentModelId === undefined) {
        return state;
      }
      const currentBackend = state.allBackends[state.currentBackendId];
      const currentModel = currentBackend?.discoveryAnswer.model_data.find(m => m.model_id === state.currentModelId);
      const currentTask = currentModel?.tasks.find(t => String(t.taskId) === action.payload.taskId);
      const currentTaskIdNum = currentTask?.taskId;
      const currentTaskId = currentTaskIdNum === undefined ? undefined : String(currentTaskIdNum);
      return {
        ...state,
        currentTaskId,
      };
    }
    case Actions.SetAssistantBackend: {
      const currentBackend = action.payload.backend;
      const currentBackendId = currentBackend.id;

      if (Object.keys(state.allBackends).length > 0) {
        if (!state.defaultBackendId || currentBackendId !== state.defaultBackendId) {
          return {
            ...state,
            allBackends: {
              ...state.allBackends,
              [action.payload.backend.id]: action.payload.backend,
            },
          };
        }
      }

      let currentModel = currentBackend?.discoveryAnswer.model_data[0];
      {
        if (currentModel && currentBackend.defaultModelId) {
          const ms = currentBackend?.discoveryAnswer.model_data ?? [];
          const found = ms.find(m => m.model_id === currentBackend.defaultModelId);
          if (found) {
            currentModel = found;
          }
        }
      }
      const currentModelId = currentModel?.model_id;
      let currentTaskIdNum = currentModel?.tasks[0]?.taskId;
      {
        // TODO: temporarily hardcode a default model task
        if (currentTaskIdNum) {
          const ms = currentModel?.tasks ?? [];
          const found = ms.find(m => m.taskTitle === ASSISTANT_DEFAULT_TASK_TITLE);
          if (found) {
            currentTaskIdNum = found.taskId;
          }
        }
      }
      const currentTaskId = currentTaskIdNum === undefined ? undefined : String(currentTaskIdNum);

      return {
        ...state,
        allBackends: {
          ...state.allBackends,
          [action.payload.backend.id]: action.payload.backend,
        },
        currentBackendId,
        currentModelId,
        currentTaskId,
      };
    }
    case Actions.SetAssistantAllBackends: {
      const arr = Object.values(action.payload.allBackends);
      const currentBackendId = arr[0]?.id;
      const currentBackend = state.allBackends[currentBackendId];
      const currentModel = currentBackend?.discoveryAnswer.model_data[0];
      const currentModelId = currentModel?.model_id;
      const currentTaskIdNum = currentModel?.tasks[0]?.taskId;
      const currentTaskId = currentTaskIdNum === undefined ? undefined : String(currentTaskIdNum);

      return {
        ...state,
        allBackends: action.payload.allBackends,
        currentBackendId,
        currentModelId,
        currentTaskId,
      };
    }
    default:
      return state;
  }
};
