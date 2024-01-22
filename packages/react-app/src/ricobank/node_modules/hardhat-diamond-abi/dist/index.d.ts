import type { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from "hardhat/types";
import { CompilationJob } from "hardhat/internal/solidity/compilation-job";
import { ResolvedFile } from "hardhat/internal/solidity/resolver";
export declare const PLUGIN_NAME: string;
export declare const PLUGIN_VERSION: string;
export declare const CONTRACT_PATH: string;
declare type ArtifactsEmittedPerFile = Array<{
    file: ResolvedFile;
    artifactsEmitted: string[];
}>;
declare type ArtifactsEmittedPerJob = Array<{
    compilationJob: CompilationJob;
    artifactsEmittedPerFile: ArtifactsEmittedPerFile;
}>;
interface DiamondAbiUserConfig {
    name: string;
    include?: string[];
    exclude?: string[];
    filter?: (abiElement: any, index: number, abi: any[], fullyQualifiedName: string) => boolean;
    strict?: boolean;
}
declare module "hardhat/types/config" {
    interface HardhatUserConfig {
        diamondAbi?: DiamondAbiUserConfig | DiamondAbiUserConfig[];
    }
    interface HardhatConfig {
        diamondAbi: {
            name: string;
            include: string[];
            exclude: string[];
            filter?: (abiElement: any, index: number, abi: any[], fullyQualifiedName: string) => boolean;
            strict: boolean;
        }[];
    }
}
export declare function generateDiamondAbi(args: TaskArguments, hre: HardhatRuntimeEnvironment, runSuper: RunSuperFunction<TaskArguments>): Promise<{
    artifactsEmittedPerJob: ArtifactsEmittedPerJob;
}>;
export {};
