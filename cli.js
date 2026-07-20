#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const [, , command, target = '.'] = process.argv;

if (!['learn', 'start'].includes(command)) {
  console.log('Usage: codestory learn <github-url | local-folder>');
  process.exit(command ? 1 : 0);
}

const root = path.dirname(fileURLToPath(import.meta.url));
const encodedTarget = command === 'learn' ? Buffer.from(target).toString('base64url') : '';
const child = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: { ...process.env, CODESTORY_TARGET: encodedTarget, CODESTORY_AUTO_OPEN: 'true' },
  stdio: 'inherit'
});

child.on('exit', code => process.exit(code ?? 0));
