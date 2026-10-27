/**
 * Strapi fills its mail templates with lodash placeholders such as `<%= URL %>`.
 * React escapes `<` and `>`, so the templates carry plain tokens that are swapped
 * for the real placeholders after rendering.
 */
export const PLACEHOLDER = {
  url: '__URL__',
  code: '__CODE__',
  token: '__TOKEN__',
  username: '__USERNAME__',
} as const;

const STRAPI_PLACEHOLDER: Record<string, string> = {
  __URL__: '<%= URL %>',
  __CODE__: '<%= CODE %>',
  __TOKEN__: '<%= TOKEN %>',
  __USERNAME__: '<%= USER.username %>',
};

export function toStrapiPlaceholders(rendered: string): string {
  return rendered.replace(/__(URL|CODE|TOKEN|USERNAME)__/g, (token) => STRAPI_PLACEHOLDER[token]);
}
