# core/system-theme-extractor

This module provides an API for obtaining and observing the preferred color scheme of an application.

## Usage

By default, the engine for the web is supported.

The engine needs to be passed to the `themeManager` constructor.

```ts
import { webEngineFactory } from 'core/system-theme-extractor/engines/web';

class iRoot extends iStaticPage {
  @system<iStaticPage>((o) => themeManagerFactory(
    // ...other required parameters for themeManager
    webEngineFactory(o)
  ))

  readonly theme: CanUndef<ThemeManager>;
}
```

Also, you can implement your own engine.

```ts
// src/core/system-theme-extractor/engines/custom/index.ts
import type { SystemThemeExtractor } from 'core/system-theme-extractor';

export default class CustomEngine implements SystemThemeExtractor {
  // Implement all necessary methods of the interface here.
}
```

See `components/super/i-static-page/modules/theme` for details