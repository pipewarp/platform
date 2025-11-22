import { ToolContext, ToolPort } from "@lcase/ports";
import { JobRequestedType } from "@lcase/types";

export class HttpJsonTool implements ToolPort {
  id = "httpjson-internal";
  name = "Internal Http Json Tool";
  async invoke(
    data: unknown,
    context: ToolContext<JobRequestedType>
  ): Promise<void> {
    throw new Error("Not Yet Implemented");
  }
}
