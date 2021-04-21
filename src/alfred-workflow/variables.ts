import getParam from 'lodash/get';
import setParam from 'lodash/set';

export type Variables = ReturnType<typeof initVariables>;

export function initVariables(vars?: Record<string, any>) {
  const prefix = 'wf_session';
  const envVars: Record<string, any> = JSON.parse(process.env[prefix] || 'null');
  const variables = Object.assign({}, vars || envVars);

  const set = <T>(path: string, value: T) => {
    setParam(variables, path, value);
  };

  const update = (vars: Record<string, unknown>) => {
    Object.keys(vars).forEach((name) => set(name, vars[name]));
    return variables;
  };

  return {
    all: () => variables,
    get: (path: string) => getParam(variables, path),
    set,
    update,
    obj: () => ({
      [prefix]: JSON.stringify(variables, null, 2),
    }),
  };
}
