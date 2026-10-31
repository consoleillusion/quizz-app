import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import $RefParser from "@apidevtools/json-schema-ref-parser";

const baseDir = import.meta.dir;
const schemaPath = path.resolve(baseDir, "multichoiceQuestion.yml");

try {
  // Load YAML and resolve local $ref references.
  const parser = new $RefParser();

  const schema = await parser.dereference(schemaPath, {
    resolve: {
      file: {
        order: 1,
      },
    },
    dereference: {
      circular: "ignore",
    },
  });

  // Compile the dereferenced schema with Ajv Draft 2020-12.
  const ajv = new Ajv2020({
    strict: false,
    allErrors: true,
  });

  ajv.compile(schema);

  // Print the expanded schema, not the generated function.
  console.log(YAML.stringify(schema));
} catch (error) {
  console.error("Schema compilation failed:");
  console.error(error);
  process.exitCode = 1;
}
