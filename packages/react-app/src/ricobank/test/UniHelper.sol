// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import { Gem } from '../lib/gemfab/src/gem.sol';
import { Ball } from '../src/ball.sol';
import { IUniswapV3Factory, IUniswapV3Pool, INonfungiblePositionManager } from './Univ3Interface.sol';

struct Asset {
    address token;
    uint256 amountIn;
}

struct PoolArgs {
    Asset a1;
    Asset a2;
    uint24 fee;
    uint160 sqrtPriceX96;
    uint160 low; // sqrtx96
    uint160 high; // sqrtx96
    int24 tickSpacing;
}

abstract contract UniSetUp{
    INonfungiblePositionManager constant nfpm =
        INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    // copied from:
    // https://github.com/Uniswap/v3-core/blob/main/contracts/libraries/TickMath.sol
    // SPDX-License-Identifier: GPL-2.0-or-later
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;
    int24   internal constant MIN_TICK       = -887272;
    int24   internal constant MAX_TICK       = -MIN_TICK;
    uint160 internal constant X96            = 2 ** 96;
    //////////////////////////////////

    address factory = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address router  = 0xE592427A0AEce92De3Edee1F18E0157C05861564;

    function getPoolAddr(address token0, address token1, uint24 fee) internal view returns (address pool) {
        pool = IUniswapV3Factory(factory).getPool(token0, token1, fee);
    }

    function getArgs(address tok1, uint256 amt1, address tok2, uint256 amt2, uint24 fee, uint160 sqrtPriceX96)
            internal view returns (PoolArgs memory args) {
        Asset memory a1 = Asset(tok1, amt1);
        Asset memory a2 = Asset(tok2, amt2);
        uint160 sqrtSpreadX96 = x96div(x96(101), x96(100));
        uint160 low = x96div(sqrtPriceX96, sqrtSpreadX96);
        uint160 high = x96mul(sqrtPriceX96, sqrtSpreadX96);
        int24  spacing = IUniswapV3Factory(factory).feeAmountTickSpacing(fee);
        args = PoolArgs(a1, a2, fee, sqrtPriceX96, low, high, spacing);
    }

    function create_pool(
        address token0,
        address token1,
        uint24  fee,
        uint160 sqrtPriceX96
    ) internal returns (address pool) {
        if (token0 > token1) {
            (token0, token1) = (token1, token0);
            sqrtPriceX96 = x96inv(sqrtPriceX96);
        }
        pool = IUniswapV3Factory(factory).getPool(token0, token1, fee);

        if (pool == address(0)) {
            pool = IUniswapV3Factory(factory).createPool(token0, token1, fee);
            IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        } else {
            (uint160 sqrtPriceX96Existing, , , , , ,) = IUniswapV3Pool(pool).slot0();
            if (sqrtPriceX96Existing == 0) {
                IUniswapV3Pool(pool).initialize(sqrtPriceX96);
            }
        }
    }

    function create_and_join_pool(PoolArgs memory args) internal returns (
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    ) {
        create_pool(args.a1.token, args.a2.token, args.fee, args.sqrtPriceX96);
        return join_pool(args);
    }

    function join_pool(PoolArgs memory args) internal returns (
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    ) {
        require(
            (args.low > 0 && args.high > 0) || 
            (0 == args.low && 0 == args.high),
            "low and high must be both 0, or both positive"
        );

        if (args.a1.token > args.a2.token){
            Asset memory a;
            a = args.a1;
            args.a1 = args.a2;
            args.a2 = a;
            args.sqrtPriceX96 = x96inv(args.sqrtPriceX96);
            uint160 low = args.low;
            uint160 high = args.high;
            if (low > 0) {
                args.low = 0 == high ? 0 : x96inv(high);
                args.high = 0 == low ? 0 : x96inv(low);
            }
        }

        int24 spacing = args.tickSpacing;
        int24 tickLower = getTickAtSqrtRatio(args.low) / spacing * spacing;
        int24 tickUpper = getTickAtSqrtRatio(args.high) / spacing * spacing;
        Gem(args.a1.token).approve(address(nfpm), args.a1.amountIn);
        Gem(args.a2.token).approve(address(nfpm), args.a2.amountIn);
        (tokenId, liquidity, amount0, amount1) = nfpm.mint(INonfungiblePositionManager.MintParams(
                args.a1.token, args.a2.token,
                args.fee,
                tickLower, tickUpper,
                args.a1.amountIn, args.a2.amountIn,
                0, 0, address(this), block.timestamp + 1000
        ));
    }

    function x96(uint160 x) internal pure returns (uint160) {
        return x * uint160(2 ** 96);
    }

    function x96mul(uint160 x, uint160 y) internal pure returns (uint160) {
        return uint160(uint(x) * uint(y) / uint(X96));
    }

    function x96inv(uint160 x) internal pure returns (uint160) {
        return x96div(X96, x);
    }

    function x96div(uint160 x, uint160 y) internal pure returns (uint160) {
        return uint160(uint(x) * uint(X96) / uint(y));
    }

    // copied from:
    // https://github.com/Uniswap/v3-periphery/blob/main/contracts/libraries/LiquidityAmounts.sol
    // SPDX-License-Identifier: GPL-2.0-or-later
    function getLiquidityForAmount0(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint256 amount0
    ) internal pure returns (uint128 liquidity) {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);
        uint256 intermediate = x96mul(sqrtRatioAX96, sqrtRatioBX96);
        return uint128(x96div(x96mul(uint160(amount0), uint160(intermediate)), sqrtRatioBX96 - sqrtRatioAX96));
    }

    /// @notice Computes the amount of liquidity received for a given amount of token1 and price range
    /// @dev Calculates amount1 / (sqrt(upper) - sqrt(lower)).
    /// @param sqrtRatioAX96 A sqrt price representing the first tick boundary
    /// @param sqrtRatioBX96 A sqrt price representing the second tick boundary
    /// @param amount1 The amount1 being sent in
    /// @return liquidity The amount of returned liquidity
    function getLiquidityForAmount1(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint256 amount1
    ) internal pure returns (uint128 liquidity) {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);
        return uint128(x96mul(uint160(amount1), sqrtRatioBX96 - sqrtRatioAX96));
    }

    function getLiquidityForAmounts(
        uint160 sqrtRatioX96,
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint256 amount0,
        uint256 amount1
    ) internal pure returns (uint128 liquidity) {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);

        if (sqrtRatioX96 <= sqrtRatioAX96) {
            liquidity = getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0);
        } else if (sqrtRatioX96 < sqrtRatioBX96) {
            uint128 liquidity0 = getLiquidityForAmount0(sqrtRatioX96, sqrtRatioBX96, amount0);
            uint128 liquidity1 = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioX96, amount1);

            liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        } else {
            liquidity = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1);
        }
    }

    // getTickAtSqrtRatio
    // copied from:
    // https://github.com/Uniswap/v3-core/blob/main/contracts/libraries/TickMath.sol
    // SPDX-License-Identifier: GPL-2.0-or-later
    function getTickAtSqrtRatio(uint160 sqrtPriceX96) internal pure returns (int24 tick) {
        // second inequality must be < because the price can never reach the price at the max tick
        require(sqrtPriceX96 >= MIN_SQRT_RATIO && sqrtPriceX96 < MAX_SQRT_RATIO, 'R');
        uint256 ratio = uint256(sqrtPriceX96) << 32;

        uint256 r = ratio;
        uint256 msb = 0;

        assembly {
            let f := shl(7, gt(r, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF))
            msb := or(msb, f)
            r := shr(f, r)
        }
        assembly {
            let f := shl(6, gt(r, 0xFFFFFFFFFFFFFFFF))
            msb := or(msb, f)
            r := shr(f, r)
        }
        assembly {
            let f := shl(5, gt(r, 0xFFFFFFFF))
            msb := or(msb, f)
            r := shr(f, r)
        }
        assembly {
            let f := shl(4, gt(r, 0xFFFF))
            msb := or(msb, f)
            r := shr(f, r)
        }
        assembly {
            let f := shl(3, gt(r, 0xFF))
            msb := or(msb, f)
            r := shr(f, r)
        }
        assembly {
            let f := shl(2, gt(r, 0xF))
            msb := or(msb, f)
            r := shr(f, r)
        }
        assembly {
            let f := shl(1, gt(r, 0x3))
            msb := or(msb, f)
            r := shr(f, r)
        }
        assembly {
            let f := gt(r, 0x1)
            msb := or(msb, f)
        }

        if (msb >= 128) r = ratio >> (msb - 127);
        else r = ratio << (127 - msb);

        int256 log_2 = (int256(msb) - 128) << 64;

        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(63, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(62, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(61, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(60, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(59, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(58, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(57, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(56, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(55, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(54, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(53, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(52, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(51, f))
            r := shr(f, r)
        }
        assembly {
            r := shr(127, mul(r, r))
            let f := shr(128, r)
            log_2 := or(log_2, shl(50, f))
        }

        int256 log_sqrt10001 = log_2 * 255738958999603826347141; // 128.128 number

        int24 tickLow = int24((log_sqrt10001 - 3402992956809132418596140100660247210) >> 128);
        int24 tickHi = int24((log_sqrt10001 + 291339464771989622907027621153398088495) >> 128);

        tick = tickLow == tickHi ? tickLow : getSqrtRatioAtTick(tickHi) <= sqrtPriceX96 ? tickHi : tickLow;
    }

    function getSqrtRatioAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {
        uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));
        require(absTick <= uint256(uint24(MAX_TICK)), 'T');

        uint256 ratio = absTick & 0x1 != 0 ? 0xfffcb933bd6fad37aa2d162d1a594001 : 0x100000000000000000000000000000000;
        if (absTick & 0x2 != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;
        if (absTick & 0x4 != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;
        if (absTick & 0x8 != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;
        if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;
        if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;
        if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;
        if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;
        if (absTick & 0x100 != 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4) >> 128;
        if (absTick & 0x200 != 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54) >> 128;
        if (absTick & 0x400 != 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3) >> 128;
        if (absTick & 0x800 != 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9) >> 128;
        if (absTick & 0x1000 != 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825) >> 128;
        if (absTick & 0x2000 != 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5) >> 128;
        if (absTick & 0x4000 != 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7) >> 128;
        if (absTick & 0x8000 != 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6) >> 128;
        if (absTick & 0x10000 != 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9) >> 128;
        if (absTick & 0x20000 != 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604) >> 128;
        if (absTick & 0x40000 != 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98) >> 128;
        if (absTick & 0x80000 != 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2) >> 128;

        if (tick > 0) ratio = type(uint256).max / ratio;

        // this divides by 1<<32 rounding up to go from a Q128.128 to a Q128.96.
        // we then downcast because we know the result always fits within 160 bits due to our tick input constraint
        // we round up in the division so getTickAtSqrtRatio of the output price is always consistent
        sqrtPriceX96 = uint160((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));
    }
    //////////////////////////////////////////

}
