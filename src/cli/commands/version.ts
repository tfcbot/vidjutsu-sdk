import { defineCommand } from "citty";
import { VERSION } from "../version";

export default defineCommand({
  meta: { name: "version", description: "Print the CLI version" },
  run() {
    console.log(`vidjutsu v${VERSION}`);
  },
});
