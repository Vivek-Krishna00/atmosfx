import { registerEffect } from './registry';
import { snow } from './effects/snow';
import { winter } from './effects/winter';
import { rain } from './effects/rain';
import { cherryBlossom } from './effects/cherry-blossom';
import { autumn } from './effects/autumn';
import { summer } from './effects/summer';
import { confetti } from './effects/confetti';
import { stars } from './effects/stars';
import { fog } from './effects/fog';
import { thunderstorm } from './effects/thunderstorm';

export * from './core';

// The full entry ships every built-in effect pre-registered.
// For the smallest bundle, import from 'atmosfx/core' and pass effect objects to mount().
registerEffect('snow', snow);
registerEffect('winter', winter);
registerEffect('rain', rain);
registerEffect('cherry-blossom', cherryBlossom);
registerEffect('autumn', autumn);
registerEffect('summer', summer);
registerEffect('confetti', confetti);
registerEffect('stars', stars);
registerEffect('fog', fog);
registerEffect('thunderstorm', thunderstorm);
