import type { ToolContext, ToolPort } from "@lcase/ports";

export class Tool implements ToolPort {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  invoke(input: unknown, context: ToolContext): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
