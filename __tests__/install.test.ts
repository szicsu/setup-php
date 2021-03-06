import * as install from '../src/install';

/**
 * Mock install.ts
 */
jest.mock('../src/install', () => ({
  build: jest.fn().mockImplementation(
    async (
      filename: string,
      version: string,
      os_version: string
    ): Promise<string> => {
      const extension_csv: string = process.env['extensions'] || '';
      const ini_values_csv: string = process.env['ini-values'] || '';
      const coverage_driver: string = process.env['coverage'] || '';
      let tools_csv: string = process.env['tools'] || '';
      const pecl: string = process.env['pecl'] || '';
      if (pecl == 'true') {
        tools_csv = 'pecl, ' + tools_csv;
      }

      let script = 'initial script ' + filename + version + os_version;
      if (extension_csv) {
        script += 'install extensions';
      }
      if (ini_values_csv) {
        script += 'edit php.ini';
      }
      if (coverage_driver) {
        script += 'set coverage driver';
      }
      if (tools_csv) {
        script += 'add_tool';
      }

      return script;
    }
  ),
  run: jest.fn().mockImplementation(
    async (): Promise<string> => {
      const os_version: string = process.env['RUNNER_OS'] || '';
      let version: string = process.env['php-version'] || '';
      version = version.length > 1 ? version.slice(0, 3) : version + '.0';
      let script = '';
      switch (os_version) {
        case 'darwin':
        case 'linux':
          script = await install.build(os_version + '.sh', version, os_version);
          script += 'sh script.sh ' + version + ' ' + __dirname;
          break;
        case 'win32':
          script = await install.build(os_version + '.sh', version, os_version);
          script += 'pwsh script.ps1 ' + version + ' ' + __dirname;
          break;
        default:
          script += os_version + ' is not supported';
      }

      return script;
    }
  )
}));

/**
 * Function to set the process.env
 *
 * @param version
 * @param os
 * @param extension_csv
 * @param ini_values_csv
 * @param coverage_driver
 */
function setEnv(
  version: string | number,
  os: string,
  extension_csv: string,
  ini_values_csv: string,
  coverage_driver: string,
  tools: string,
  pecl: string
): void {
  process.env['php-version'] = version.toString();
  process.env['RUNNER_OS'] = os;
  process.env['extensions'] = extension_csv;
  process.env['ini-values'] = ini_values_csv;
  process.env['coverage'] = coverage_driver;
  process.env['tools'] = tools;
  process.env['pecl'] = pecl;
}

describe('Install', () => {
  it('Test install on windows', async () => {
    setEnv('7.0', 'win32', '', '', '', '', '');
    // @ts-ignore
    let script: string = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('pwsh script.ps1 7.0 ' + __dirname);

    setEnv('7.3', 'win32', '', '', '', '', '');
    // @ts-ignore
    script = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('pwsh script.ps1 7.3 ' + __dirname);

    setEnv('7.3', 'win32', 'a, b', 'a=b', 'x', '', '');
    // @ts-ignore
    script = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('install extensions');
    expect(script).toContain('edit php.ini');
    expect(script).toContain('set coverage driver');
    expect(script).toContain('pwsh script.ps1 7.3 ' + __dirname);
  });

  it('Test install on linux', async () => {
    setEnv('7.3', 'linux', '', '', '', '', '');
    // @ts-ignore
    let script: string = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('sh script.sh 7.3 ');

    setEnv('7.3', 'linux', 'a, b', 'a=b', 'x', 'phpunit', 'true');
    // @ts-ignore
    script = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('install extensions');
    expect(script).toContain('edit php.ini');
    expect(script).toContain('set coverage driver');
    expect(script).toContain('sh script.sh 7.3');
    expect(script).toContain('add_tool');

    setEnv('7.3', 'linux', 'a, b', 'a=b', 'x', 'phpunit', '');
    // @ts-ignore
    script = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('install extensions');
    expect(script).toContain('edit php.ini');
    expect(script).toContain('set coverage driver');
    expect(script).toContain('sh script.sh 7.3');
    expect(script).toContain('add_tool');
  });

  it('Test install on darwin', async () => {
    setEnv('7.3', 'darwin', '', '', '', '', '');
    // @ts-ignore
    let script: string = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('sh script.sh 7.3 ' + __dirname);

    setEnv('7.3', 'darwin', 'a, b', 'a=b', 'x', '', '');
    // @ts-ignore
    script = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('install extensions');
    expect(script).toContain('edit php.ini');
    expect(script).toContain('set coverage driver');
    expect(script).toContain('sh script.sh 7.3 ' + __dirname);
  });

  it('Test malformed version inputs', async () => {
    setEnv('7.4.1', 'darwin', '', '', '', '', '');
    // @ts-ignore
    let script: string = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('sh script.sh 7.4 ' + __dirname);

    setEnv(8.0, 'darwin', '', '', '', '', '');
    // @ts-ignore
    script = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('sh script.sh 8.0 ' + __dirname);

    setEnv(8, 'darwin', '', '', '', '', '');
    // @ts-ignore
    script = await install.run();
    expect(script).toContain('initial script');
    expect(script).toContain('sh script.sh 8.0 ' + __dirname);
  });
});
