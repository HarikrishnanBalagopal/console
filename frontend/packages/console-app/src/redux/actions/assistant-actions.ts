import { AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { action, ActionType } from 'typesafe-actions';
import { RootState } from '@console/internal/redux';
import { getAllAssistantBackends, postFeedbackToAssistantApi, postQueryToAssistantApi, waitForAnswerFromAssistantApi } from '../../components/assistant/assistant-utils';
import { AssistantAllBackends, AssistantAnswer, AssistantBackendForRedux } from '../../components/assistant/assistant-types';
import {
  isAssistantFetchingBackends, selectAssistantAllBackends, selectAssistantCurrentBackend,
  selectAssistantCurrentJobId, selectAssistantCurrentModelId, selectAssistantCurrentTaskId,
} from '../reducers/assistant-selectors';

export enum Actions {
  SetAssistantExpanded = 'setAssistantExpanded',
  SetAssistantHideAdvancedTab = 'setAssistantHideAdvancedTab',
  SetAssistantFetchingBackends = 'setAssistantFetchingBackends',
  SetAssistantFetchingBackendsPartial = 'setAssistantFetchingBackendsPartial',
  SetAssistantLoading = 'setAssistantLoading',
  SetAssistantSendingFeedback = 'setAssistantSendingFeedback',
  SetAssistantFetchingBackendsError = 'setAssistantFetchingBackendsError',
  SetAssistantError = 'setAssistantError',
  SetAssistantFeedbackError = 'setAssistantFeedbackError',
  SetAssistantAnswer = 'setAssistantAnswer',
  SetAssistantYaml = 'setAssistantYaml',
  SetAssistantCommand = 'setAssistantCommand',
  SetAssistantCurrentBackendId = 'setAssistantCurrentBackendId',
  SetAssistantCurrentModelId = 'setAssistantCurrentModelId',
  SetAssistantCurrentTaskId = 'setAssistantCurrentTaskId',
  SetAssistantCurrentJobId = 'setAssistantCurrentJobId',
  SetAssistantCurrentJobProgress = 'setAssistantCurrentJobProgress',
  SetAssistantBackend = 'setAssistantBackend',
  SetAssistantAllBackends = 'setAssistantAllBackends',
  SetCurrentEditorYaml = 'setCurrentEditorYaml',
}

export const setAssistantExpanded = (isExpanded: boolean) =>
  action(Actions.SetAssistantExpanded, { isExpanded });

export const setAssistantHideAdvancedTab = (hideAdvancedTab: boolean) =>
  action(Actions.SetAssistantHideAdvancedTab, { hideAdvancedTab });

export const setAssistantFetchingBackends = (isFetchingBackends: boolean) =>
  action(Actions.SetAssistantFetchingBackends, { isFetchingBackends });

export const setAssistantFetchingBackendsPartial = (isFetchingBackendsPartial: boolean) =>
  action(Actions.SetAssistantFetchingBackendsPartial, { isFetchingBackendsPartial });

export const setAssistantLoading = (isLoading: boolean) =>
  action(Actions.SetAssistantLoading, { isLoading });

export const setAssistantSendingFeedback = (sendingFeedback: boolean) =>
  action(Actions.SetAssistantSendingFeedback, { sendingFeedback });

export const setAssistantFetchingBackendsError = (fetchingBackendsError: string | undefined) =>
  action(Actions.SetAssistantFetchingBackendsError, { fetchingBackendsError });

export const setAssistantError = (error: string | undefined) =>
  action(Actions.SetAssistantError, { error });

export const setAssistantFeedbackError = (feedbackError: string | undefined) =>
  action(Actions.SetAssistantFeedbackError, { feedbackError });

export const setAssistantAnswer = (answer: AssistantAnswer | undefined) =>
  action(Actions.SetAssistantAnswer, { answer });

export const setAssistantYaml = (yaml: string | undefined, isAppend: boolean) =>
  action(Actions.SetAssistantYaml, { yaml, isAppend });

export const setAssistantCommand = (command: string | undefined) =>
  action(Actions.SetAssistantCommand, { command });

export const setAssistantCurrentBackendId = (backendId: string | undefined) =>
  action(Actions.SetAssistantCurrentBackendId, { backendId });

export const setAssistantCurrentModelId = (modelId: string | undefined) =>
  action(Actions.SetAssistantCurrentModelId, { modelId });

export const setAssistantCurrentTaskId = (taskId: string | undefined) =>
  action(Actions.SetAssistantCurrentTaskId, { taskId });

export const setAssistantCurrentJobId = (jobId: string | undefined) =>
  action(Actions.SetAssistantCurrentJobId, { jobId });

export const setAssistantCurrentJobProgress = (jobProgress: number) =>
  action(Actions.SetAssistantCurrentJobProgress, { jobProgress });

export const setAssistantBackend = (backend: AssistantBackendForRedux) =>
  action(Actions.SetAssistantBackend, { backend });

export const setAssistantAllBackends = (allBackends: AssistantAllBackends) =>
  action(Actions.SetAssistantAllBackends, { allBackends });

export const setCurrentEditorYaml = (yaml: string | undefined) =>
  action(Actions.SetCurrentEditorYaml, { yaml });

const actions = {
  setAssistantExpanded,
  setAssistantHideAdvancedTab,
  setAssistantFetchingBackends,
  setAssistantFetchingBackendsPartial,
  setAssistantLoading,
  setAssistantSendingFeedback,
  setAssistantFetchingBackendsError,
  setAssistantError,
  setAssistantFeedbackError,
  setAssistantAnswer,
  setAssistantYaml,
  setAssistantCommand,
  setAssistantCurrentBackendId,
  setAssistantCurrentModelId,
  setAssistantCurrentTaskId,
  setAssistantCurrentJobId,
  setAssistantCurrentJobProgress,
  setAssistantBackend,
  setAssistantAllBackends,
  setCurrentEditorYaml,
};

export type AssistantActions = ActionType<typeof actions>;

export const initializeAssistant = (): ThunkAction<void, RootState, unknown, AnyAction> =>
  async (dispatch, getState) => {
    try {
      const state = getState();
      const allBackends = selectAssistantAllBackends(state);
      if (Object.keys(allBackends).length > 0) {
        console.log('data about Assistant backends has already been fetched');
        return;
      }
      if (isAssistantFetchingBackends(state)) {
        console.log('already fetching all the Assistant backends, skipping');
        return;
      }
      dispatch(setAssistantFetchingBackendsPartial(false));
      dispatch(setAssistantFetchingBackends(true));
      await getAllAssistantBackends(
        (w: AssistantBackendForRedux) => {
          dispatch(setAssistantBackend(w));
          dispatch(setAssistantFetchingBackendsPartial(true));
        },
        (hideAdvancedTab: boolean) => {
          dispatch(setAssistantHideAdvancedTab(hideAdvancedTab));
        },
      );
      dispatch(setAssistantFetchingBackends(false));
    } catch (e) {
      console.error('failed to initialize Assistant', e);
      dispatch(setAssistantFetchingBackends(false));
    }
  };

export const sendQueryToAssistant = (query: string): ThunkAction<void, RootState, unknown, AnyAction> =>
  async (dispatch, getState) => {
    dispatch(setAssistantCurrentJobProgress(0));
    dispatch(setAssistantLoading(true));
    dispatch(setAssistantError(undefined));
    dispatch(setAssistantFeedbackError(undefined));
    dispatch(setAssistantCurrentJobId(undefined));
    try {
      const state = getState();
      const currBackend = selectAssistantCurrentBackend(state);
      const modelId = selectAssistantCurrentModelId(state);
      const taskId = selectAssistantCurrentTaskId(state);
      if (!currBackend) throw new Error('no Assistant backend selected');
      if (!modelId) throw new Error('no Assistant backend model selected');
      if (!taskId) throw new Error('no Assistant backend model task selected');
      const partialAnswer = await postQueryToAssistantApi(currBackend, modelId, taskId, query);
      dispatch(setAssistantCurrentJobId(partialAnswer.job_id));
      const answer = await waitForAnswerFromAssistantApi(currBackend, partialAnswer.job_id, (x) => dispatch(setAssistantCurrentJobProgress(x)));
      dispatch(setAssistantAnswer(answer));
      dispatch(setAssistantLoading(false));
      return;
    } catch (e) {
      console.error('failed to post the query to Assistant api.', e);
      dispatch(setAssistantError(`${e}`));
      dispatch(setAssistantLoading(false));
      return;
    }
  };

export const sendFeedbackToAssistant = (good: boolean): ThunkAction<void, RootState, unknown, AnyAction> =>
  async (dispatch, getState) => {
    dispatch(setAssistantSendingFeedback(true));
    dispatch(setAssistantFeedbackError(undefined));
    try {
      const state = getState();
      const currBackend = selectAssistantCurrentBackend(state);
      if (!currBackend) throw new Error('no Assistant backend selected');
      const jobId = selectAssistantCurrentJobId(state) ?? '';
      if (!jobId) throw new Error('there is no current job. Send a prompt to Assistant first.');
      await postFeedbackToAssistantApi(currBackend, jobId, good);
      dispatch(setAssistantSendingFeedback(false));
      return;
    } catch (e) {
      console.error('failed to post the query to Assistant api.', e);
      dispatch(setAssistantFeedbackError(`${e}`));
      dispatch(setAssistantSendingFeedback(false));
      return;
    }
  };
