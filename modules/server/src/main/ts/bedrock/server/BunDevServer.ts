import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as finalhandler from 'finalhandler';
import * as portfinder from 'portfinder';
import * as Serve from './Serve';
import * as Routes from './Routes';
import * as BunCompiler from '../compiler/BunCompiler';

export interface BunDevServerSettings extends Serve.ServeSettings {
  readonly enableHotReload?: boolean;
  readonly watchFiles?: string[];
  readonly config?: string;
  readonly coverage?: string[];
  readonly polyfills?: string[];
}

/**
 * Enhanced development server with Bun compilation and enhanced features
 * Uses Node.js HTTP server for compatibility but with Bun-inspired dev experience
 */
export const startBunDevServer = async (settings: BunDevServerSettings): Promise<Serve.ServeService> => {
  const { runner, projectdir, basedir } = settings;
  const routers = runner.routers;
  const fallback = runner.fallback;
  
  // Recompilation function for file watching
  const recompileTests = async () => {
    try {
      const startTime = Date.now();
      await BunCompiler.compile(
        settings.config || 'tsconfig.json',
        path.join(projectdir, 'scratch'),
        basedir,
        false, // Don't exit on error in watch mode
        settings.testfiles,
        settings.coverage || [],
        settings.polyfills || []
      );
      const elapsedTime = Date.now() - startTime;
      console.log(`Hot reload complete (${elapsedTime}ms)`);
    } catch (error: any) {
      console.error('Recompilation failed:', error.message);
    }
  };

  if (settings.enableHotReload && settings.watchFiles) {
    console.log('Setting up file watching for hot reload...');
    
    // Watch test files for changes
    for (const file of settings.testfiles) {
      if (fs.existsSync(file)) {
        fs.watch(file, { recursive: false }, (eventType, filename) => {
          if (eventType === 'change' && filename) {
            console.log(`File changed: ${filename}`);
            recompileTests().catch(console.error);
          }
        });
      }
    }
  }

  const port = settings.port ?? await portfinder.getPortPromise({
    port: 8000,
    stopPort: 20000
  });

  const createErrorPage = (status: number, title: string, message: string, details?: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333; margin: 0; min-height: 100vh;
            }
            .container { max-width: 800px; margin: 0 auto; }
            .error { 
              background: white; padding: 40px; border-radius: 12px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              backdrop-filter: blur(10px);
            }
            .error h1 { 
              color: #e74c3c; margin: 0 0 20px 0; 
              font-size: 2.5rem; font-weight: 300;
            }
            .error p { color: #666; line-height: 1.6; font-size: 1.1rem; }
            .path { 
              font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; 
              background: #f8f9fa; padding: 8px 12px; border-radius: 6px;
              border-left: 4px solid #007acc;
            }
            .details {
              background: #f8f9fa; padding: 20px; border-radius: 8px;
              font-family: monospace; white-space: pre-wrap;
              max-height: 300px; overflow-y: auto;
              border-left: 4px solid #ffa726;
            }
            .links { margin-top: 30px; }
            .links a { 
              color: #007acc; text-decoration: none; 
              padding: 8px 16px; background: #e3f2fd;
              border-radius: 6px; margin-right: 10px;
              display: inline-block; margin-bottom: 10px;
            }
            .links a:hover { background: #bbdefb; }
            .badge { 
              display: inline-block; background: #4caf50; color: white;
              padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">
              <div class="badge">Enhanced Dev Server</div>
              <h1>${title}</h1>
              <p>${message}</p>
              ${details ? `<div class="details">${details}</div>` : ''}
              <div class="links">
                <a href="/">🏠 Home</a>
                <a href="/harness">⚙️ Configuration</a>
                <a href="/compiled/tests.js">📦 Compiled Tests</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    
    try {
      if (url.pathname === '/tests/init') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      
      if (url.pathname === '/tests/start') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      
      if (url.pathname === '/tests/results') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      
      if (url.pathname === '/tests/done') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      
      if (url.pathname === '/tests/alive') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      
      if (url.pathname === '/compiled/tests.js') {
        try {
          // Use the same compilation logic as RunnerRoutes for consistency
          const compiledPath = await BunCompiler.compile(
            settings.config || 'tsconfig.json',
            path.join(projectdir, 'scratch'),
            basedir,
            false, // Don't exit on error in manual mode
            settings.testfiles,
            settings.coverage || [],
            settings.polyfills || []
          );
          
          const content = await fs.promises.readFile(compiledPath, 'utf8');
          response.writeHead(200, { 
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache, no-store, must-revalidate', // Always fresh for dev
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          response.end(content);
          return;
        } catch (error: any) {
          const errorPage = createErrorPage(500, 'Test Compilation Failed', 
            'Failed to compile tests for manual mode.',
            `Compilation error: ${error.message}`);
          response.writeHead(500, { 'Content-Type': 'text/html' });
          response.end(errorPage);
          return;
        }
      }
      
      const done = finalhandler(request, response, {
        onerror: (err: any) => {
          const errorPage = createErrorPage(500, 'Server Error', err.message, err.stack);
          response.writeHead(500, { 'Content-Type': 'text/html' });
          response.end(errorPage);
        }
      });
      
      Routes.route(routers, fallback, request, response, done);
      
    } catch (error: any) {
      console.error('Server error:', error);
      const errorPage = createErrorPage(500, 'Internal Server Error', error.message, error.stack);
      response.writeHead(500, { 'Content-Type': 'text/html' });
      response.end(errorPage);
    }
  });

  server.requestTimeout = 120000;
  
  await new Promise<void>((resolve) => {
    server.listen(port, () => resolve());
  });

  console.log(`Enhanced Dev Server with Bun compilation`);
  console.log(`   http://localhost:${port}`);
  console.log(`   Hot reload: ${settings.enableHotReload ? 'enabled' : 'disabled'}`);
  console.log(`   File watching: ${settings.enableHotReload ? 'active' : 'disabled'}`);
  console.log(`   Beautiful error pages with enhanced navigation`);

  return {
    port,
    markLoaded: () => {},
    enableHud: () => {},
    awaitDone: () => new Promise(() => {}), // Manual mode never ends
    shutdown: async () => {
      server.close();
    }
  };
};