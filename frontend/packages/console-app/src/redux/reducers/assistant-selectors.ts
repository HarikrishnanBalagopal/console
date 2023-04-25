import { RootState } from '@console/internal/redux';
import { AssistantAllBackends, AssistantAnswer, AssistantBackendForRedux } from '../../components/assistant/assistant-types';

export const assistantReducerName = 'assistant';

export const isAssistantExpanded = (state: RootState): boolean =>
  !!state.plugins?.console?.[assistantReducerName]?.isExpanded;

export const isAssistantHideAdvancedTab = (state: RootState): boolean =>
  !!state.plugins?.console?.[assistantReducerName]?.hideAdvancedTab;

export const isAssistantFetchingBackends = (state: RootState): boolean =>
  !!state.plugins?.console?.[assistantReducerName]?.isFetchingBackends;

export const isAssistantFetchingBackendsPartial = (state: RootState): boolean =>
  !!state.plugins?.console?.[assistantReducerName]?.isFetchingBackendsPartial;

export const isAssistantLoading = (state: RootState): boolean =>
  !!state.plugins?.console?.[assistantReducerName]?.isLoading;

export const isAssistantSendingFeedback = (state: RootState): boolean =>
  !!state.plugins?.console?.[assistantReducerName]?.isSendingFeedback;

export const selectAssistantAnswer = (state: RootState): (AssistantAnswer | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.answer;

export const selectAssistantFetchingBackendsError = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.fetchingBackendsError;

export const selectAssistantError = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.error;

export const selectAssistantFeedbackError = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.feedbackError;

export const selectAssistantYaml = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.yaml;

export const selectAssistantYamlAppend = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.yamlIsAppend;

export const selectAssistantCommand = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.command;

export const selectAssistantCurrentBackendId = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.currentBackendId;

export const selectAssistantCurrentModelId = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.currentModelId;

export const selectAssistantCurrentTaskId = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.currentTaskId;

export const selectAssistantCurrentJobId = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.currentJobId;

export const selectAssistantCurrentJobProgress = (state: RootState): (number | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.currentJobProgress;

export const selectAssistantAllBackends = (state: RootState): (AssistantAllBackends | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.allBackends;

export const selectAssistantCurrentBackend = (state: RootState): (AssistantBackendForRedux | undefined) => {
  const currBackendId = selectAssistantCurrentBackendId(state) ?? '';
  return state.plugins?.console?.[assistantReducerName]?.allBackends[currBackendId];
}
export const selectAssistantCurrentEditorYaml = (state: RootState): (string | undefined) =>
  state.plugins?.console?.[assistantReducerName]?.currentEditorYaml;
