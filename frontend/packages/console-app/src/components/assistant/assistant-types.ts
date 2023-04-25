export type HTTPMethod = 'GET' | 'POST' | 'DELETE';
export type AssistantEndpoint = {
    "methods": {
        [m in HTTPMethod]: {};
    };
    "path": string;
};
export type AssistantModelTask = {
    "examples": Array<{
        "text": string;
    }>;
    "format": string;
    "postProcessor": string;
    "shots": string;
    "taskId": number;
    "taskTitle": string;
};
export type AssistantModel = {
    "model_id": string;
    "model_path": string;
    "tasks": Array<AssistantModelTask>;
};
export type DiscoveryAnswer = {
    "endpoints": Array<{
        "api_discovery_endpoint": AssistantEndpoint;
        "api_feedback_endpoint": AssistantEndpoint;
        "api_jobs_endpoint": AssistantEndpoint;
        "api_key_endpoint": AssistantEndpoint;
        "api_models_endpoint": AssistantEndpoint;
        "api_tasks_endpoint": AssistantEndpoint;
    }>;
    "model_data": Array<AssistantModel>;
};
export type AsyncAssistantAnswerJobId = {
    job_id: string;
};

export type AssistantAnswer = {
    all_tokens: string;
    input_tokens: string;
    job_id: string;
    model: string;
    status: string;
    task_id: string;
    task_output: string;
};
export type AssistantAuthCreds = {
    email: string;
    token: string;
}
export type AssistantBackendForRedux = {
    id: string;
    host: URL;
    discoveryAnswer: DiscoveryAnswer;
    creds?: AssistantAuthCreds;
}
export type AssistantAllBackends = {
    [id: string]: AssistantBackendForRedux;
};
