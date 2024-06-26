import {
  CosignedV2DutchOrder as SDKDutchOrderV2,
  CosignedV2DutchOrderInfoJSON,
  encodeExclusiveFillerData,
  V2DutchOrderBuilder,
} from '@uniswap/uniswapx-sdk'
import { BigNumber, constants } from 'ethers'
import { ChainId } from '../../lib/util/chain'
import { Tokens } from '../unit/fixtures'
import { PartialDeep } from './PartialDeep'

/**
 * Helper class for building CosignedV2DutchOrders.
 * All values adpated from  https://github.com/Uniswap/uniswapx-sdk/blob/7949043e7d2434553f84f588e1405e87d249a5aa/src/builder/V2DutchOrderBuilder.test.ts#L22
 */
export class SDKDutchOrderV2Factory {
  static buildDutchV2Order(
    chainId = ChainId.MAINNET,
    overrides: PartialDeep<CosignedV2DutchOrderInfoJSON> = {}
  ): SDKDutchOrderV2 {
    // Values adapted from https://github.com/Uniswap/uniswapx-sdk/blob/7949043e7d2434553f84f588e1405e87d249a5aa/src/utils/order.test.ts#L28
    const nowInSeconds = Math.floor(Date.now() / 1000)

    // Arbitrary default future time ten seconds in future
    const futureTime = nowInSeconds + 10

    let builder = new V2DutchOrderBuilder(chainId)

    builder = builder
      .cosigner(overrides.cosigner ?? constants.AddressZero)
      .cosignature(overrides.cosignature ?? '0x')
      .deadline(overrides.deadline ?? futureTime)
      .decayEndTime(overrides.cosignerData?.decayEndTime ?? futureTime)
      .decayStartTime(overrides.cosignerData?.decayStartTime ?? nowInSeconds)
      .swapper(overrides.swapper ?? '0x0000000000000000000000000000000000000000')
      .nonce(overrides.nonce ? BigNumber.from(overrides.nonce) : BigNumber.from(100))
      .input({
        token: overrides.input?.token ?? Tokens.MAINNET.USDC,
        startAmount: overrides.input?.startAmount
          ? BigNumber.from(overrides.input?.startAmount)
          : BigNumber.from('1000000'),
        endAmount: overrides.input?.endAmount ? BigNumber.from(overrides.input?.endAmount) : BigNumber.from('1000000'),
      })
      .inputOverride(
        overrides.cosignerData?.inputOverride
          ? BigNumber.from(overrides.cosignerData?.inputOverride)
          : BigNumber.from('1000000')
      )

    const outputs = overrides.outputs ?? [
      {
        token: Tokens.MAINNET.WETH,
        startAmount: '1000000000000000000',
        endAmount: '1000000000000000000',
        recipient: '0x0000000000000000000000000000000000000000',
      },
    ]
    for (const output of outputs) {
      builder = builder.output({
        token: output?.token ?? Tokens.MAINNET.WETH,
        startAmount: output?.startAmount ? BigNumber.from(output?.startAmount) : BigNumber.from('1000000000000000000'),
        endAmount: output?.endAmount ? BigNumber.from(output?.endAmount) : BigNumber.from('1000000000000000000'),
        recipient: output?.recipient ?? '0x0000000000000000000000000000000000000000',
      })
    }

    const outputOverrides = overrides.cosignerData?.outputOverrides
      ? overrides.cosignerData?.outputOverrides.map((num) => BigNumber.from(num))
      : [BigNumber.from('1000000000000000000')]

    const validationInfo = encodeExclusiveFillerData(
      overrides.cosignerData?.exclusiveFiller ?? '0x1111111111111111111111111111111111111111',
      overrides.deadline ?? futureTime,
      chainId,
      overrides.additionalValidationContract ?? '0x2222222222222222222222222222222222222222'
    )
    builder = builder.outputOverrides(outputOverrides).validation(validationInfo)

    return builder.build()
  }
}
