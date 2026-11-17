import { registerEffect } from './registry';
import { snow } from './effects/snow';
import { rain } from './effects/rain';

export * from './core';

// The full entry ships every built-in effect pre-registered.
// For the smallest bundle, import from 'atmosfx/core' and pass effect objects to mount().
registerEffect('snow', snow);
registerEffect('winter', snow);
registerEffect('rain', rain);
