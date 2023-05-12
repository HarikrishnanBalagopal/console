import { coFetch } from '@console/internal/co-fetch';
import { ListKind, AssistantKind, SecretKind, resourceURL } from '@console/internal/module/k8s';
import { AssistantModel, SecretModel } from '@console/internal/models';
import { Base64 } from 'js-base64';
import { AssistantAuthCreds, AssistantAnswer, DiscoveryAnswer, AssistantBackendForRedux, AsyncAssistantAnswerJobId } from './assistant-types';

export const ASSISTANT_VERSION = 'v1.170.0';
export const ASSISTANT_TITLE = 'Lightspeed';
const ASSISTANT_AUTH_EMAIL = 'assistant-email';
const ASSISTANT_AUTH_TOKEN = 'assistant-token';
let ASSISTANT_MAX_POLL_ATTEMPTS = 60;
let ASSISTANT_POLL_SLEEP_MS = 3000;
export const ASSISTANT_TASK_MODE = 'asynchronous';
// TODO: temporarily hardcode a default model task
// export const ASSISTANT_DEFAULT_TASK_TITLE = 'NL to Answer generation';
export const ASSISTANT_DEFAULT_TASK_TITLE = 'NL to YAML generation';

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const checkAssistantAvailable = () => new Promise((resolve) => resolve(true)); // DEBUG: TODO fix this
export const getAcceptContentTypeHeaders = (mimeType: string = 'application/json') => ({
  'Accept': mimeType,
  'Content-Type': mimeType,
});

export const getAssistantAuthHeaders = (creds: AssistantAuthCreds) => ({
  'Authorization': 'Bearer ' + creds.token,
  'Email': creds.email,
});

export const getJobsEndpointFromBackend = (backend: AssistantBackendForRedux, jobId?: string): URL => {
  if (backend.discoveryAnswer.endpoints.length === 0) throw new Error('this backend has no endpoints');
  const jobsPath = backend.discoveryAnswer.endpoints[0].api_jobs_endpoint.path ?? '';
  const jobsEndpoint = new URL(backend.host);
  jobsEndpoint.pathname = jobsPath;
  if (jobId) {
    jobsEndpoint.pathname = `${jobsPath}/${jobId}`;
  }
  return jobsEndpoint;
}

export const getAllObjectsOfAssistantKind = async (): Promise<ListKind<AssistantKind>> => {
  const url = resourceURL(AssistantModel, {});
  const res = await coFetch(url);
  if (!res.ok) {
    throw new Error(`failed to get the assistant. status: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const getAssistantAuthSecret = async (namespace: string, name: string): Promise<SecretKind> => {
  const url = resourceURL(SecretModel, { ns: namespace, name });
  const res = await coFetch(url);
  if (!res.ok) {
    throw new Error(`failed to get the assistant auth secret. status: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const getAssistantAuthCredsFromSecret = (sec: SecretKind): AssistantAuthCreds => {
  const email = sec.data[ASSISTANT_AUTH_EMAIL];
  const token = sec.data[ASSISTANT_AUTH_TOKEN];
  return { email: Base64.decode(email), token: Base64.decode(token) };
}

export const getAssistantBackendDiscoveryInfo = async (discoveryEndpoint: string, creds?: AssistantAuthCreds): Promise<DiscoveryAnswer> => {
  const options: RequestInit = { headers: getAcceptContentTypeHeaders() };
  if (creds) {
    options.headers = { ...options.headers, ...getAssistantAuthHeaders(creds) };
  }
  const res = await fetch(discoveryEndpoint, options);
  if (!res.ok) {
    throw new Error(`failed to query the assistant discovery endpoint '${discoveryEndpoint}' . status: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const postQueryToAssistantApi = async (
  backend: AssistantBackendForRedux, modelId: string, taskId: string, query: string,
): Promise<AsyncAssistantAnswerJobId> => {
  const body = JSON.stringify({
    // eslint-disable-next-line @typescript-eslint/camelcase
    'model_id': modelId,
    // eslint-disable-next-line @typescript-eslint/camelcase
    'task_id': taskId,
    'mode': ASSISTANT_TASK_MODE,
    'prompt': query,
  });
  const options = {
    method: 'POST',
    headers: getAcceptContentTypeHeaders(),
    body,
  };
  if (backend.creds) {
    options.headers = { ...options.headers, ...getAssistantAuthHeaders(backend.creds) };
  }
  const jobsEndpoint = getJobsEndpointFromBackend(backend);
  const res = await fetch(jobsEndpoint, options);
  if (!res.ok) {
    throw new Error(`failed to post the query '${query}' to the Assistant endpoint '${jobsEndpoint}' . status: ${res.status}`);
  }
  const data: AssistantAnswer = await res.json();
  return data;
};

export const waitForAnswerFromAssistantApi = async (
  backend: AssistantBackendForRedux, jobId: string, setProgress: (x: number) => void,
): Promise<AssistantAnswer> => {
  setProgress(0);
  const options = {
    method: 'GET',
    headers: getAcceptContentTypeHeaders(),
  };
  if (backend.creds) {
    options.headers = { ...options.headers, ...getAssistantAuthHeaders(backend.creds) };
  }
  const jobsEndpoint = getJobsEndpointFromBackend(backend, jobId);
  let attemptNumber = 1;
  while (attemptNumber < ASSISTANT_MAX_POLL_ATTEMPTS) {
    console.log('poll attempt number', attemptNumber);
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(jobsEndpoint, options);
    if (!res.ok) {
      throw new Error(`failed to get the answer from the Assistant endpoint '${jobsEndpoint}' for the job id '${jobId}' . status: ${res.status}`);
    }
    if (res.status === 200) {
      // eslint-disable-next-line no-await-in-loop
      const data: AssistantAnswer = await res.json();
      return data;
    }
    console.log('wait and poll again because status is', res.status, res.statusText);
    // eslint-disable-next-line no-await-in-loop
    await sleep(ASSISTANT_POLL_SLEEP_MS);
    attemptNumber++;
    setProgress(100 * attemptNumber / ASSISTANT_MAX_POLL_ATTEMPTS);
  }
  throw new Error(`failed to get a respoonse after ${ASSISTANT_MAX_POLL_ATTEMPTS} poll attempts`);
};

export const postFeedbackToAssistantApi = async (
  endpoint: AssistantBackendForRedux, jobId: string, good: boolean,
): Promise<void> => {
  const body = JSON.stringify({
    // eslint-disable-next-line @typescript-eslint/camelcase
    corrected_output: "",
    feedback: "",
    vote: good ? "1" : "-1",
  });
  const options = {
    method: 'POST',
    headers: getAcceptContentTypeHeaders(),
    body,
  };
  if (endpoint.creds) {
    options.headers = { ...options.headers, ...getAssistantAuthHeaders(endpoint.creds) };
  }
  const feedbackPathTemplate = endpoint.discoveryAnswer.endpoints[0]?.api_feedback_endpoint.path ?? '';
  const feedbackPath = feedbackPathTemplate.replace('<job_id>', jobId);
  const feedbackEndpoint = new URL(endpoint.host);
  feedbackEndpoint.pathname = feedbackPath;
  const res = await fetch(feedbackEndpoint, options);
  if (!res.ok) {
    throw new Error(`failed to post the feedback to Assistant endpoint '${feedbackEndpoint}' for the jobs with id '${jobId}' . status: ${res.status}`);
  }
};

export const getAllAssistantBackends = async (
  setDefaultBackendId: (id: string) => void,
  addANewBackend: (w: AssistantBackendForRedux) => void,
  setHideAdvancedTab: (x: boolean) => void
): Promise<void> => {
  console.log('fetching data about assistant backends');
  try {
    const allAssistantObjects = await getAllObjectsOfAssistantKind();
    console.log('got all assistant objects:', allAssistantObjects);
    if (allAssistantObjects.items.length !== 1) {
      throw new Error(`expected there to be exactly one object of kind Assistant. actual: ${JSON.stringify(allAssistantObjects)}`);
    }
    const assistantObject = allAssistantObjects.items[0];
    console.log('assistantObject', assistantObject);
    const assistantNamespace = assistantObject.metadata?.namespace ?? 'default';
    console.log('assistantNamespace', assistantNamespace);
    if (assistantObject.spec.defaultBackendId) {
      console.log('setting the default backend id:', assistantObject.spec.defaultBackendId);
      setDefaultBackendId(assistantObject.spec.defaultBackendId);
    }
    if (Number.isInteger(assistantObject.spec.maxPollAttempts) && assistantObject.spec.maxPollAttempts > 0) {
      ASSISTANT_MAX_POLL_ATTEMPTS = assistantObject.spec.maxPollAttempts;
    }
    if (Number.isInteger(assistantObject.spec.timeBetweenPollAttempts) && assistantObject.spec.timeBetweenPollAttempts > 0) {
      ASSISTANT_POLL_SLEEP_MS = assistantObject.spec.timeBetweenPollAttempts;
    }
    if (assistantObject.spec.hideAdvancedTab !== undefined) setHideAdvancedTab(Boolean(assistantObject.spec.hideAdvancedTab));
    await Promise.all(assistantObject.spec.backends.map(async (backend) => {
      try {
        console.log('assistant backend', backend);
        let creds: AssistantAuthCreds | undefined = undefined;
        if (backend.auth) {
          const backendAuthSecret = await getAssistantAuthSecret(assistantNamespace, backend.auth.secretName);
          console.log('got the auth secret for the assistant backend', backend.name, 'secret', backendAuthSecret);
          creds = getAssistantAuthCredsFromSecret(backendAuthSecret);
          console.log('got the auth credentials', creds);
        }
        const discoveryAnswer = await getAssistantBackendDiscoveryInfo(backend.discoveryEndpoint, creds);
        const host = new URL(backend.discoveryEndpoint);
        const backendObj: AssistantBackendForRedux = {
          id: backend.id,
          name: backend.name,
          host,
          discoveryAnswer,
          defaultModelId: backend.defaultModelId,
          creds,
        };
        console.log('found another backend:', backendObj);
        addANewBackend(backendObj);
      } catch (e) {
        console.error(`failed to get the assistant backend ${JSON.stringify(backend)} ${e}`);
      }
    }));
  } catch (e) {
    throw new Error(`failed to get all the assistant backends. ${e}`);
  }
}
