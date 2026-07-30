export class InputError extends Error {
  override readonly name = "InputError";
}

export class CliError extends Error {
  override readonly name = "CliError";
}
