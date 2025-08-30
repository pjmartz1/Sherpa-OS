import { promises as fs, existsSync } from 'fs';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import YAML from 'yaml';

export async function ensureDir(dirPath: string): Promise<void> {
  await fsExtra.ensureDir(dirPath);
}

export async function writeYaml(filePath: string, data: any): Promise<void> {
  const yamlContent = YAML.stringify(data);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, yamlContent, 'utf-8');
}

export async function readYaml<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return YAML.parse(content) as T;
}

export async function writeJson(filePath: string, data: any): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export async function writeMarkdown(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function readMarkdown(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getSherpaRoot(): string {
  let currentDir = process.cwd();
  
  while (currentDir !== path.dirname(currentDir)) {
    const sherpaPath = path.join(currentDir, '.sherpa');
    if (existsSync(sherpaPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return process.cwd();
}

export function getSherpaDir(): string {
  return path.join(getSherpaRoot(), '.sherpa');
}