import { WisdomAllBackends, WisdomAnswer } from '../../components/wisdom/wisdom-types';
import { DEFAULT_WISDOM_MODEL_ID, DEFAULT_WISDOM_TASK_TITLE } from '../../components/wisdom/wisdom-utils';
import { WisdomActions, Actions } from '../actions/wisdom-actions';

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
  answer: WisdomAnswer | undefined;
  yaml: string | undefined;
  yamlIsAppend: boolean;
  command: string | undefined;
  allBackends: WisdomAllBackends;
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
  currentBackendId: undefined,
  currentModelId: undefined,
  currentTaskId: undefined,
  currentJobId: undefined,
  currentJobProgress: -1,
  currentEditorYaml: undefined,
  allBackends: {},
};

export default (state = initialState, action: WisdomActions): State => {
  switch (action.type) {
    case Actions.SetWisdomExpanded:
      return {
        ...state,
        isExpanded: action.payload.isExpanded,
      };
    case Actions.SetWisdomHideAdvancedTab:
      return {
        ...state,
        hideAdvancedTab: action.payload.hideAdvancedTab,
      };
    case Actions.SetWisdomFetchingBackends:
      return {
        ...state,
        isFetchingBackends: action.payload.isFetchingBackends,
      };
    case Actions.SetWisdomFetchingBackendsPartial:
      return {
        ...state,
        isFetchingBackendsPartial: action.payload.isFetchingBackendsPartial,
      };
    case Actions.SetWisdomLoading:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
    case Actions.SetWisdomSendingFeedback:
      return {
        ...state,
        isSendingFeedback: action.payload.sendingFeedback,
      };
    case Actions.SetWisdomFetchingBackendsError:
      return {
        ...state,
        fetchingBackendsError: action.payload.fetchingBackendsError,
      };
    case Actions.SetWisdomError:
      return {
        ...state,
        error: action.payload.error,
      };
    case Actions.SetWisdomFeedbackError:
      return {
        ...state,
        feedbackError: action.payload.feedbackError,
      };
    case Actions.SetWisdomAnswer:
      return {
        ...state,
        answer: action.payload.answer,
      };
    case Actions.SetWisdomYaml:
      return {
        ...state,
        yaml: action.payload.yaml,
        yamlIsAppend: action.payload.isAppend,
      };
    case Actions.SetWisdomCommand:
      return {
        ...state,
        command: action.payload.command,
      };
    case Actions.SetCurrentEditorYaml:
      return {
        ...state,
        currentEditorYaml: action.payload.yaml,
      };
    case Actions.SetWisdomCurrentJobId:
      return {
        ...state,
        currentJobId: action.payload.jobId,
      };
    case Actions.SetWisdomCurrentJobProgress:
      return {
        ...state,
        currentJobProgress: action.payload.jobProgress,
      };
    case Actions.SetWisdomCurrentBackendId: {
      const currentBackendId = action.payload.backendId;
      const currentBackend = state.allBackends[currentBackendId];
      let currentModel = currentBackend?.discoveryAnswer.model_data[0];
      {
        // TODO: temporarily hardcode a default model
        if (currentModel) {
          const ms = currentBackend?.discoveryAnswer.model_data ?? [];
          const found = ms.find(m => m.model_id === DEFAULT_WISDOM_MODEL_ID);
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
          const found = ms.find(m => m.taskTitle === DEFAULT_WISDOM_TASK_TITLE);
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
    case Actions.SetWisdomCurrentModelId: {
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
          const found = ms.find(m => m.taskTitle === DEFAULT_WISDOM_TASK_TITLE);
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
    case Actions.SetWisdomCurrentTaskId: {
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
    case Actions.SetWisdomBackend: {
      if (Object.keys(state.allBackends).length > 0) {
        return {
          ...state,
          allBackends: {
            ...state.allBackends,
            [action.payload.backend.id]: action.payload.backend,
          },
        };
      }

      const currentBackend = action.payload.backend;
      const currentBackendId = currentBackend.id;
      let currentModel = currentBackend?.discoveryAnswer.model_data[0];
      {
        // TODO: temporarily hardcode a default model
        if (currentModel) {
          const ms = currentBackend?.discoveryAnswer.model_data ?? [];
          const found = ms.find(m => m.model_id === DEFAULT_WISDOM_MODEL_ID);
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
          const found = ms.find(m => m.taskTitle === DEFAULT_WISDOM_TASK_TITLE);
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
    case Actions.SetWisdomAllBackends: {
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
