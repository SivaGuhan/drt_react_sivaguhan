export const extractValues = (input: string) => {
  if (input.startsWith("{") && input.endsWith("}")) {
    return input.slice(1, -1).split(",");
  }
  return [input];
}