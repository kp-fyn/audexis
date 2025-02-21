import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";

import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import MakerDMG from "@electron-forge/maker-dmg";

const config: ForgeConfig = {
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        authToken: `${process.env.GITHUB_TOKEN}`,
        draft: true,
        prerelease: true,
        generateReleaseNotes: true,

        repository: {
          owner: "kp-fyn",
          name: "audexis",
        },
      },
    },
  ],
  packagerConfig: {
    name: "Audexis",
    icon: "./resources/images/Audexis",
    asar: true,
    extraResource: ["resources"],

    osxSign: {
      identity: `${process.env.APPLE_IDENTITY}`,
    },

    osxNotarize: {
      appleId: `${process.env.APPLE_ID}`,
      appleIdPassword: `${process.env.APPLE_PASSWORD}`,
      teamId: `${process.env.APPLE_TEAM_ID}`,
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin"]),
    new MakerDMG({ name: "Audexis", format: "ULFO" }, ["darwin"]),
  ],

  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/backend/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/backend/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
