// Render with the application's React JSX transform, outside Playwright's component transform.
import {readFileSync} from 'node:fs'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {TonightSummary} from '../../../src/features/home/HomePage'
process.stdout.write(renderToStaticMarkup(createElement(TonightSummary,{payload:JSON.parse(readFileSync(0,'utf8'))})))
