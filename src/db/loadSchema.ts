import $RefParser from "@apidevtools/json-schema-ref-parser";
import {join} from "path"

export async function loadSchema(directory: string = join(import.meta.dirname, "./schema")) {
  const schemas = [];
  const glob = new Bun.Glob("*.yml");

  for await (const file of glob.scan({
    cwd: directory,
    onlyFiles: true,
  })) {
    const schema = await $RefParser.dereference(`${directory}/${file}`, {
      resolve: {
        file: { order: 1 },
      },
      dereference: {
        circular: "ignore",
      },
    });

    schemas.push(schema);
  }

  return schemas;
}

