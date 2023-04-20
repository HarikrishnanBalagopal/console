import { AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { action, ActionType } from 'typesafe-actions';
import { RootState } from '@console/internal/redux';
import { getAllWisdomBackends, postFeedbackToWisdomApi, postQueryToWisdomApi, waitForAnswerFromWisdomApi } from '../../components/wisdom/wisdom-utils';
import { WisdomAllBackends, WisdomAnswer, WisdomBackendForRedux } from '../../components/wisdom/wisdom-types';
import { isWisdomFetchingBackends, selectWisdomAllBackends, selectWisdomCurrentBackend, selectWisdomCurrentJobId, selectWisdomCurrentModelId, selectWisdomCurrentTaskId } from '../reducers/wisdom-selectors';

export enum Actions {
  SetWisdomExpanded = 'setWisdomExpanded',
  SetWisdomHideAdvancedTab = 'setWisdomHideAdvancedTab',
  SetWisdomFetchingBackends = 'setWisdomFetchingBackends',
  SetWisdomFetchingBackendsPartial = 'setWisdomFetchingBackendsPartial',
  SetWisdomLoading = 'setWisdomLoading',
  SetWisdomSendingFeedback = 'setWisdomSendingFeedback',
  SetWisdomFetchingBackendsError = 'setWisdomFetchingBackendsError',
  SetWisdomError = 'setWisdomError',
  SetWisdomFeedbackError = 'setWisdomFeedbackError',
  SetWisdomAnswer = 'setWisdomAnswer',
  SetWisdomYaml = 'setWisdomYaml',
  SetWisdomCommand = 'setWisdomCommand',
  SetWisdomCurrentBackendId = 'setWisdomCurrentBackendId',
  SetWisdomCurrentModelId = 'setWisdomCurrentModelId',
  SetWisdomCurrentTaskId = 'setWisdomCurrentTaskId',
  SetWisdomCurrentJobId = 'setWisdomCurrentJobId',
  SetWisdomCurrentJobProgress = 'setWisdomCurrentJobProgress',
  SetWisdomBackend = 'setWisdomBackend',
  SetWisdomAllBackends = 'setWisdomAllBackends',
  SetCurrentEditorYaml = 'setCurrentEditorYaml',
}

export const setWisdomExpanded = (isExpanded: boolean) =>
  action(Actions.SetWisdomExpanded, { isExpanded });

export const setWisdomHideAdvancedTab = (hideAdvancedTab: boolean) =>
  action(Actions.SetWisdomHideAdvancedTab, { hideAdvancedTab });

export const setWisdomFetchingBackends = (isFetchingBackends: boolean) =>
  action(Actions.SetWisdomFetchingBackends, { isFetchingBackends });

export const setWisdomFetchingBackendsPartial = (isFetchingBackendsPartial: boolean) =>
  action(Actions.SetWisdomFetchingBackendsPartial, { isFetchingBackendsPartial });

export const setWisdomLoading = (isLoading: boolean) =>
  action(Actions.SetWisdomLoading, { isLoading });

export const setWisdomSendingFeedback = (sendingFeedback: boolean) =>
  action(Actions.SetWisdomSendingFeedback, { sendingFeedback });

export const setWisdomFetchingBackendsError = (fetchingBackendsError: string | undefined) =>
  action(Actions.SetWisdomFetchingBackendsError, { fetchingBackendsError });

export const setWisdomError = (error: string | undefined) =>
  action(Actions.SetWisdomError, { error });

export const setWisdomFeedbackError = (feedbackError: string | undefined) =>
  action(Actions.SetWisdomFeedbackError, { feedbackError });

export const setWisdomAnswer = (answer: WisdomAnswer | undefined) =>
  action(Actions.SetWisdomAnswer, { answer });

export const setWisdomYaml = (yaml: string | undefined, isAppend: boolean) =>
  action(Actions.SetWisdomYaml, { yaml, isAppend });

export const setWisdomCommand = (command: string | undefined) =>
  action(Actions.SetWisdomCommand, { command });

export const setWisdomCurrentBackendId = (backendId: string | undefined) =>
  action(Actions.SetWisdomCurrentBackendId, { backendId });

export const setWisdomCurrentModelId = (modelId: string | undefined) =>
  action(Actions.SetWisdomCurrentModelId, { modelId });

export const setWisdomCurrentTaskId = (taskId: string | undefined) =>
  action(Actions.SetWisdomCurrentTaskId, { taskId });

export const setWisdomCurrentJobId = (jobId: string | undefined) =>
  action(Actions.SetWisdomCurrentJobId, { jobId });

export const setWisdomCurrentJobProgress = (jobProgress: number) =>
  action(Actions.SetWisdomCurrentJobProgress, { jobProgress });

export const setWisdomBackend = (backend: WisdomBackendForRedux) =>
  action(Actions.SetWisdomBackend, { backend });

export const setWisdomAllBackends = (allBackends: WisdomAllBackends) =>
  action(Actions.SetWisdomAllBackends, { allBackends });

export const setCurrentEditorYaml = (yaml: string | undefined) =>
  action(Actions.SetCurrentEditorYaml, { yaml });

const actions = {
  setWisdomExpanded,
  setWisdomHideAdvancedTab,
  setWisdomFetchingBackends,
  setWisdomFetchingBackendsPartial,
  setWisdomLoading,
  setWisdomSendingFeedback,
  setWisdomFetchingBackendsError,
  setWisdomError,
  setWisdomFeedbackError,
  setWisdomAnswer,
  setWisdomYaml,
  setWisdomCommand,
  setWisdomCurrentBackendId,
  setWisdomCurrentModelId,
  setWisdomCurrentTaskId,
  setWisdomCurrentJobId,
  setWisdomCurrentJobProgress,
  setWisdomBackend,
  setWisdomAllBackends,
  setCurrentEditorYaml,
};

export type WisdomActions = ActionType<typeof actions>;

export const initializeWisdom = (): ThunkAction<void, RootState, unknown, AnyAction> =>
  async (dispatch, getState) => {
    try {
      const state = getState();
      const allBackends = selectWisdomAllBackends(state);
      if (Object.keys(allBackends).length > 0) {
        console.log('data about wisdom backends has already been fetched');
        return;
      }
      if (isWisdomFetchingBackends(state)) {
        console.log('already fetching all the wisdom backends, skipping');
        return;
      }
      dispatch(setWisdomFetchingBackendsPartial(false));
      dispatch(setWisdomFetchingBackends(true));
      await getAllWisdomBackends(
        (w: WisdomBackendForRedux) => {
          dispatch(setWisdomBackend(w));
          dispatch(setWisdomFetchingBackendsPartial(true));
        },
        (hideAdvancedTab: boolean) => {
          dispatch(setWisdomHideAdvancedTab(hideAdvancedTab));
        },
      );
      dispatch(setWisdomFetchingBackends(false));
    } catch (e) {
      console.error('failed to initialize wisdom', e);
      dispatch(setWisdomFetchingBackends(false));
    }
  };

export const sendQueryToWisdom = (query: string): ThunkAction<void, RootState, unknown, AnyAction> =>
  async (dispatch, getState) => {
    dispatch(setWisdomCurrentJobProgress(0));
    dispatch(setWisdomLoading(true));
    dispatch(setWisdomError(undefined));
    dispatch(setWisdomFeedbackError(undefined));
    dispatch(setWisdomCurrentJobId(undefined));
    try {
      const state = getState();
      const currBackend = selectWisdomCurrentBackend(state);
      const modelId = selectWisdomCurrentModelId(state);
      const taskId = selectWisdomCurrentTaskId(state);
      if (!currBackend) throw new Error('no wisdom backend selected');
      if (!modelId) throw new Error('no wisdom backend model selected');
      if (!taskId) throw new Error('no wisdom backend model task selected');
      const partialAnswer = await postQueryToWisdomApi(currBackend, modelId, taskId, query);
      dispatch(setWisdomCurrentJobId(partialAnswer.job_id));
      const answer = await waitForAnswerFromWisdomApi(currBackend, partialAnswer.job_id, (x) => dispatch(setWisdomCurrentJobProgress(x)));
      dispatch(setWisdomAnswer(answer));
      dispatch(setWisdomLoading(false));
      return;
    } catch (e) {
      console.error('failed to post the query to wisdom api.', e);
      dispatch(setWisdomError(`${e}`));
      dispatch(setWisdomLoading(false));
      return;
    }
  };

export const sendFeedbackToWisdom = (good: boolean): ThunkAction<void, RootState, unknown, AnyAction> =>
  async (dispatch, getState) => {
    dispatch(setWisdomSendingFeedback(true));
    dispatch(setWisdomFeedbackError(undefined));
    try {
      const state = getState();
      const currBackend = selectWisdomCurrentBackend(state);
      if (!currBackend) throw new Error('no wisdom backend selected');
      const jobId = selectWisdomCurrentJobId(state) ?? '';
      if (!jobId) throw new Error('there is no current job. Send a prompt to Wisdom first.');
      await postFeedbackToWisdomApi(currBackend, jobId, good);
      dispatch(setWisdomSendingFeedback(false));
      return;
    } catch (e) {
      console.error('failed to post the query to wisdom api.', e);
      dispatch(setWisdomFeedbackError(`${e}`));
      dispatch(setWisdomSendingFeedback(false));
      return;
    }
  };
