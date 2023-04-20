import { RootState } from '@console/internal/redux';
import { WisdomAllBackends, WisdomAnswer, WisdomBackendForRedux } from '../../components/wisdom/wisdom-types';

export const wisdomReducerName = 'wisdom';

export const isWisdomExpanded = (state: RootState): boolean =>
  !!state.plugins?.console?.[wisdomReducerName]?.isExpanded;

export const isWisdomHideAdvancedTab = (state: RootState): boolean =>
  !!state.plugins?.console?.[wisdomReducerName]?.hideAdvancedTab;

export const isWisdomFetchingBackends = (state: RootState): boolean =>
  !!state.plugins?.console?.[wisdomReducerName]?.isFetchingBackends;

export const isWisdomFetchingBackendsPartial = (state: RootState): boolean =>
  !!state.plugins?.console?.[wisdomReducerName]?.isFetchingBackendsPartial;

export const isWisdomLoading = (state: RootState): boolean =>
  !!state.plugins?.console?.[wisdomReducerName]?.isLoading;

export const isWisdomSendingFeedback = (state: RootState): boolean =>
  !!state.plugins?.console?.[wisdomReducerName]?.isSendingFeedback;

export const selectWisdomAnswer = (state: RootState): (WisdomAnswer | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.answer;

export const selectWisdomFetchingBackendsError = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.fetchingBackendsError;

export const selectWisdomError = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.error;

export const selectWisdomFeedbackError = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.feedbackError;

export const selectWisdomYaml = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.yaml;

export const selectWisdomYamlAppend = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.yamlIsAppend;

export const selectWisdomCommand = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.command;

export const selectWisdomCurrentBackendId = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.currentBackendId;

export const selectWisdomCurrentModelId = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.currentModelId;

export const selectWisdomCurrentTaskId = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.currentTaskId;

export const selectWisdomCurrentJobId = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.currentJobId;

export const selectWisdomCurrentJobProgress = (state: RootState): (number | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.currentJobProgress;

export const selectWisdomAllBackends = (state: RootState): (WisdomAllBackends | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.allBackends;

export const selectWisdomCurrentBackend = (state: RootState): (WisdomBackendForRedux | undefined) => {
  const currBackendId = selectWisdomCurrentBackendId(state) ?? '';
  return state.plugins?.console?.[wisdomReducerName]?.allBackends[currBackendId];
}
export const selectWisdomCurrentEditorYaml = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[wisdomReducerName]?.currentEditorYaml;
