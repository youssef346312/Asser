import { execSync } from 'child_process';
import { copyFileSync, mkdirSync } from 'fs';
import path from 'path';

// Build the client
console.log('Building client...');
execSync('npm run build', { stdio: 'inherit' });

// Create public directory in dist if it doesn't exist
const distPath = path.resolve(process.cwd(), 'dist');
const publicPath = path.join(distPath, 'public');

try {
  mkdirSync(publicPath, { recursive: true });
} catch (err) {
  // Directory might already exist
}

// Copy _redirects file to dist
try {
  copyFileSync('_redirects', path.join(distPath, '_redirects'));
  console.log('Copied _redirects to dist/');
} catch (err) {
  console.log('Warning: Could not copy _redirects file');
}

// Copy generated-icon.png to dist
try {
  copyFileSync('generated-icon.png', path.join(distPath, 'generated-icon.png'));
  console.log('Copied icon to dist/');
} catch (err) {
  console.log('Warning: Could not copy icon file');
}

console.log('Build completed successfully!');