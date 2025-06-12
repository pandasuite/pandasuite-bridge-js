// UMD entry point - exports only default for clean window.PandaBridge access
import PandaBridge, { Binder } from './index.js';

// Attach Binder to PandaBridge for UMD users
PandaBridge.Binder = Binder;

export default PandaBridge;
