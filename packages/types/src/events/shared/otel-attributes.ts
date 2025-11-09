export type DomainActionDescriptor<
  Domain extends string,
  Action extends string,
  Data
> = {
  domain: Domain;
  action: Action;
  entity: undefined;
  data: Data;
};

export type DomainEntityActionDescriptor<
  Domain extends string,
  Entity extends string,
  Action extends string,
  Data
> = {
  domain: Domain;
  entity: Entity;
  action: Action;
  data: Data;
};
