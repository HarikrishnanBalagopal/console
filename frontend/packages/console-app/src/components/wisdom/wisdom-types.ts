export type HTTPMethod = 'GET' | 'POST' | 'DELETE';
export type WisdomEndpoint = {
    "methods": {
        [m in HTTPMethod]: {};
    };
    "path": string;
};
export type WisdomModelTask = {
    "examples": Array<{
        "text": string;
    }>;
    "format": string;
    "postProcessor": string;
    "shots": string;
    "taskId": number;
    "taskTitle": string;
};
export type WisdomModel = {
    "model_id": string;
    "model_path": string;
    "tasks": Array<WisdomModelTask>;
};
export type DiscoveryAnswer = {
    "endpoints": Array<{
        "api_discovery_endpoint": WisdomEndpoint;
        "api_feedback_endpoint": WisdomEndpoint;
        "api_jobs_endpoint": WisdomEndpoint;
        "api_key_endpoint": WisdomEndpoint;
        "api_models_endpoint": WisdomEndpoint;
        "api_tasks_endpoint": WisdomEndpoint;
    }>;
    "model_data": Array<WisdomModel>;
};
export type AsyncWisdomAnswerJobId = {
    job_id: string;
};

export type WisdomAnswer = {
    all_tokens: string;
    input_tokens: string;
    job_id: string;
    model: string;
    status: string;
    task_id: string;
    task_output: string;
};
export type WisdomAuthCreds = {
    email: string;
    token: string;
}
export type WisdomBackendForRedux = {
    id: string;
    host: URL;
    discoveryAnswer: DiscoveryAnswer;
    creds?: WisdomAuthCreds;
}
export type WisdomAllBackends = {
    [id: string]: WisdomBackendForRedux;
};
