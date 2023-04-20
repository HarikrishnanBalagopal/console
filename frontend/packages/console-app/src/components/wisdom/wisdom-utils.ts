import { coFetch } from '@console/internal/co-fetch';
import { ListKind, WisdomKind, SecretKind, resourceURL } from '@console/internal/module/k8s';
import { WisdomModel, SecretModel } from '@console/internal/models';
import { Base64 } from 'js-base64';
import { WisdomAuthCreds, WisdomAnswer, DiscoveryAnswer, WisdomBackendForRedux, AsyncWisdomAnswerJobId } from './wisdom-types';

export const WISDOM_VERSION = 'v1.154';
const DEFAULT_NAMESPACE = 'default';
const WISDOM_EMAIL = 'wisdom-email';
const WISDOM_TOKEN = 'wisdom-token';
const WISDOM_MAX_POLL_ATTEMPTS = 60;
const WISDOM_MAX_POLL_SLEEP_MS = 3000;
export const WISDOM_ENDPOINT = 'http://localhost:10000/api/v1/jobs';
export const WISDOM_TASK_MODE = 'asynchronous';
// TODO: temporarily hardcode a default model
// export const DEFAULT_WISDOM_MODEL_ID = 'L3Byb2plY3RzL3dpc2RvbV9mb3Jfb3BlbnNoaWZ0L2Jsb29tei0xYjcvc3RhY2tvdmVyZmxvdy1kYXRhLWFsbC10YWdzL21hcmtkb3duL3RhZ2dlZC9jaGVja3BvaW50LTk0MzI4';
export const DEFAULT_WISDOM_MODEL_ID = 'L3Byb2plY3RzL3dpc2RvbV9mb3Jfb3BlbnNoaWZ0L2Jsb29tei0xYjcvc3RhY2tvdmVyZmxvdy1kYXRhLWFsbC10YWdzL21hcmtkb3duL3RhZ2dlZC9ibG9vbXpfMWI3X2FsbC9jaGVja3BvaW50LTQxMDAw';
// TODO: temporarily hardcode a default model task
// export const DEFAULT_WISDOM_TASK_TITLE = 'NL to Answer generation';
export const DEFAULT_WISDOM_TASK_TITLE = 'NL to YAML generation';

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const checkWisdomAvailable = () => new Promise((resolve) => resolve(true)); // DEBUG: TODO fix this
export const getAcceptContentTypeHeaders = (mimeType: string = 'application/json') => ({
  'Accept': mimeType,
  'Content-Type': mimeType,
});

export const getWisdomAuthHeaders = (creds: WisdomAuthCreds) => ({
  'Authorization': 'Bearer ' + creds.token,
  'Email': creds.email,
});

export const getJobsEndpointFromBackend = (backend: WisdomBackendForRedux, jobId?: string): URL => {
  if (backend.discoveryAnswer.endpoints.length === 0) throw new Error('this backend has no endpoints');
  const jobsPath = backend.discoveryAnswer.endpoints[0].api_jobs_endpoint.path ?? '';
  const jobsEndpoint = new URL(backend.host);
  jobsEndpoint.pathname = jobsPath;
  if (jobId) {
    jobsEndpoint.pathname = `${jobsPath}/${jobId}`;
  }
  return jobsEndpoint;
}

export const getAllObjectsOfWisdomKind = async (): Promise<ListKind<WisdomKind>> => {
  const url = resourceURL(WisdomModel, {});
  const res = await coFetch(url);
  if (!res.ok) {
    throw new Error(`failed to get the wisdom. status: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const getWisdomAuthSecret = async (namespace: string, name: string): Promise<SecretKind> => {
  const url = resourceURL(SecretModel, { ns: namespace, name });
  const res = await coFetch(url);
  if (!res.ok) {
    throw new Error(`failed to get the wisdom auth secret. status: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const getWisdomAuthCredsFromSecret = (sec: SecretKind): WisdomAuthCreds => {
  const email = sec.data[WISDOM_EMAIL];
  const token = sec.data[WISDOM_TOKEN];
  return { email: Base64.decode(email), token: Base64.decode(token) };
}

export const getWisdomBackendDiscoveryInfo = async (discoveryEndpoint: string, creds?: WisdomAuthCreds): Promise<DiscoveryAnswer> => {
  const options: RequestInit = { headers: getAcceptContentTypeHeaders() };
  if (creds) {
    options.headers = { ...options.headers, ...getWisdomAuthHeaders(creds) };
  }
  const res = await fetch(discoveryEndpoint, options);
  if (!res.ok) {
    throw new Error(`failed to query the wisdom discovery endpoint '${discoveryEndpoint}' . status: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const postQueryToWisdomApi = async (
  backend: WisdomBackendForRedux, modelId: string, taskId: string, query: string,
): Promise<AsyncWisdomAnswerJobId> => {
  const body = JSON.stringify({
    // eslint-disable-next-line @typescript-eslint/camelcase
    'model_id': modelId,
    // eslint-disable-next-line @typescript-eslint/camelcase
    'task_id': taskId,
    'mode': WISDOM_TASK_MODE,
    'prompt': query,
  });
  const options = {
    method: 'POST',
    headers: getAcceptContentTypeHeaders(),
    body,
  };
  if (backend.creds) {
    options.headers = { ...options.headers, ...getWisdomAuthHeaders(backend.creds) };
  }
  const jobsEndpoint = getJobsEndpointFromBackend(backend);
  const res = await fetch(jobsEndpoint, options);
  if (!res.ok) {
    throw new Error(`failed to post the query '${query}' to the Wisdom endpoint '${jobsEndpoint}' . status: ${res.status}`);
  }
  const data: WisdomAnswer = await res.json();
  return data;
};

export const waitForAnswerFromWisdomApi = async (
  backend: WisdomBackendForRedux, jobId: string, setProgress: (x: number) => void,
): Promise<WisdomAnswer> => {
  setProgress(0);
  const options = {
    method: 'GET',
    headers: getAcceptContentTypeHeaders(),
  };
  if (backend.creds) {
    options.headers = { ...options.headers, ...getWisdomAuthHeaders(backend.creds) };
  }
  const jobsEndpoint = getJobsEndpointFromBackend(backend, jobId);
  let attemptNumber = 1;
  while (attemptNumber < WISDOM_MAX_POLL_ATTEMPTS) {
    console.log('poll attempt number', attemptNumber);
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(jobsEndpoint, options);
    if (!res.ok) {
      throw new Error(`failed to get the answer from the Wisdom endpoint '${jobsEndpoint}' for the job id '${jobId}' . status: ${res.status}`);
    }
    if (res.status === 200) {
      // eslint-disable-next-line no-await-in-loop
      const data: WisdomAnswer = await res.json();
      return data;
    }
    console.log('wait and poll again because status is', res.status, res.statusText);
    // eslint-disable-next-line no-await-in-loop
    await sleep(WISDOM_MAX_POLL_SLEEP_MS);
    attemptNumber++;
    setProgress(100 * attemptNumber / WISDOM_MAX_POLL_ATTEMPTS);
  }
  throw new Error(`failed to get a respoonse after ${WISDOM_MAX_POLL_ATTEMPTS} poll attempts`);
};

export const postFeedbackToWisdomApi = async (
  endpoint: WisdomBackendForRedux, jobId: string, good: boolean,
): Promise<void> => {
  // if (!ALL_WISDOM_ENDPOINTS) throw new Error('wisdom config has not been initialized yet');
  // console.log('using the following wisdom config:', ALL_WISDOM_ENDPOINTS);
  // if (!(endpointName in ALL_WISDOM_ENDPOINTS)) throw new Error(`the wisdom endpoint ${endpointName} was not found`);
  // const endpoint = ALL_WISDOM_ENDPOINTS[endpointName];
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
    options.headers = { ...options.headers, ...getWisdomAuthHeaders(endpoint.creds) };
  }
  const feedbackPathTemplate = endpoint.discoveryAnswer.endpoints[0]?.api_feedback_endpoint.path ?? '';
  const feedbackPath = feedbackPathTemplate.replace('<job_id>', jobId);
  const feedbackEndpoint = new URL(endpoint.host);
  feedbackEndpoint.pathname = feedbackPath;
  const res = await fetch(feedbackEndpoint, options);
  if (!res.ok) {
    throw new Error(`failed to post the feedback to Wisdom endpoint '${feedbackEndpoint}' for the jobs with id '${jobId}' . status: ${res.status}`);
  }
};

export const getAllWisdomBackends = async (addANewBackend: (w: WisdomBackendForRedux) => void, setHideAdvancedTab: (x: boolean) => void): Promise<void> => {
  console.log('fetching data about wisdom backends');
  try {
    const allWisdomObjects = await getAllObjectsOfWisdomKind();
    console.log('got all wisdom objects:', allWisdomObjects);
    if (allWisdomObjects.items.length !== 1) {
      throw new Error(`expected there to be exactly one object of kind Wisdom. actual: ${JSON.stringify(allWisdomObjects)}`);
    }
    const wisdomObject = allWisdomObjects.items[0];
    console.log('wisdomObject', wisdomObject, 'name', wisdomObject.metadata?.name, 'backends', wisdomObject.spec.backends);
    console.log('DEBUG !!!!!!!!!!!!!!!! wisdomObject.spec.hideAdvancedTab', wisdomObject.spec.hideAdvancedTab);
    if (wisdomObject.spec.hideAdvancedTab !== undefined) setHideAdvancedTab(Boolean(wisdomObject.spec.hideAdvancedTab));
    // const promises = wisdomObject.spec.backends.map(getSingleWisdomBackend);
    // const results = await Promise.allSettled(promises);
    // const finalBackends: Array<WisdomBackendForRedux> = results
    //   .filter(result => result.status === 'fulfilled')
    //   .map(result => (result as PromiseFulfilledResult<WisdomBackendForRedux>).value);
    // console.log('finalBackends', finalBackends);
    wisdomObject.spec.backends.forEach(async (backend) => {
      try {
        console.log('wisdom backend', backend);
        let creds: WisdomAuthCreds | undefined = undefined;
        if (backend.auth) {
          const backendAuthSecret = await getWisdomAuthSecret(DEFAULT_NAMESPACE, backend.auth.secretName);
          console.log('got the auth secret for the wisdom backend', backend.name, 'secret', backendAuthSecret);
          creds = getWisdomAuthCredsFromSecret(backendAuthSecret);
          console.log('got the auth credentials', creds);
        }
        const discoveryAnswer = await getWisdomBackendDiscoveryInfo(backend.discoveryEndpoint, creds);
        const host = new URL(backend.discoveryEndpoint);
        const backendObj: WisdomBackendForRedux = {
          id: backend.name,
          host,
          discoveryAnswer,
          creds,
        };
        console.log('found another backend:', backendObj);
        addANewBackend(backendObj);
      } catch (e) {
        console.error(`failed to get the wisdom backend ${JSON.stringify(backend)} ${e}`);
      }
    });
  } catch (e) {
    throw new Error(`failed to get all the wisdom backends. ${e}`);
  }
}
