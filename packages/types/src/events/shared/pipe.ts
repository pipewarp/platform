export type PipeData = {
  to?: {
    id: string;
    payload: string;
  };
  from?: {
    id: string;
    buffer?: number;
  };
};

export type PipeStepFields = {
  to?: {
    step: string;
    payload: string;
  };
  from?: {
    step: string;
    buffer?: number;
  };
};
