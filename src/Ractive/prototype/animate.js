import runloop from '../../global/runloop';
import interpolate from '../../shared/interpolate';
import Promise from '../../utils/Promise';
import { defineProperty } from '../../utils/object';
import { isEqual } from '../../utils/is';
import { splitKeypath } from '../../shared/keypaths';
import easing from '../../Ractive/static/easing';
import noop from '../../utils/noop';

let noAnimation = Promise.resolve();
defineProperty( noAnimation, 'stop', { value: noop });

const linear = easing.linear;

function getOptions ( options, instance ) {
	options = options || {};

	let easing;
	if ( options.easing ) {
		easing = typeof options.easing === 'function' ?
			options.easing :
			instance.easing[ options.easing ];
	}

	return {
		easing: easing || linear,
		duration: 'duration' in options ? options.duration : 400,
		complete: options.complete || noop,
		step: options.step || noop
	};
}

export function animate ( ractive, model, to, options ) {
	options = getOptions( options, ractive );
	const from = model.get();

	// don't bother animating values that stay the same
	if ( isEqual( from, to ) ) {
		options.complete( options.to );
		return noAnimation; // TODO should this have .then and .catch methods?
	}

	const interpolator = interpolate( from, to, ractive, options.interpolator );

	// if we can't interpolate the value, set it immediately
	if ( !interpolator ) {
		runloop.start();
		model.set( to );
		runloop.end();

		return noAnimation;
	}

	return model.animate( from, to, options, interpolator );
}

export default function Ractive$animate ( keypath, to, options ) {
	if ( typeof keypath === 'object' ) {
		const keys = Object.keys( keypath );

		throw new Error( `ractive.animate(...) no longer supports objects. Instead of ractive.animate({
  ${keys.map( key => `'${key}': ${keypath[ key ]}` ).join( '\n  ' )}
}, {...}), do

${keys.map( key => `ractive.animate('${key}', ${keypath[ key ]}, {...});` ).join( '\n' )}
` );
	}


	return animate( this, this.viewmodel.joinAll( splitKeypath( keypath ) ), to, options );
}
