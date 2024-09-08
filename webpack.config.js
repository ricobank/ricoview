import path from 'path'
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename, 'app');

const config = {
    mode: 'production',
    entry: {
        main: './main.js',
    },
    output: {
        path: path.resolve(__dirname, 'app'),
        filename: '[name].unmin.js',
    },
    optimization: {
        minimize: false,
        splitChunks: {
            cacheGroups: {
                dependencies: {
                    name: 'dependencies',
                    minChunks: 1,
                    chunks: 'all',
                    test: /[\\/]node_modules[\\/]/,
                },
            },
        },
    },
};

export default config
