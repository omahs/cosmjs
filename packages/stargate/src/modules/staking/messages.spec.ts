import { coin, Secp256k1HdWallet } from "@cosmjs/amino";
import { Random } from "@cosmjs/crypto";
import { fromBech32, toBase64, toBech32 } from "@cosmjs/encoding";
import { DirectSecp256k1HdWallet, encodePubkey } from "@cosmjs/proto-signing";

import { calculateFee } from "../../fee";
import { SigningStargateClient } from "../../signingstargateclient";
import { assertIsDeliverTxFailure, assertIsDeliverTxSuccess } from "../../stargateclient";
import {
  defaultGasPrice,
  defaultSigningClientOptions,
  faucet,
  pendingWithoutSimapp,
  simapp,
} from "../../testutils.spec";
import { MsgCreateValidatorEncodeObject, MsgEditValidatorEncodeObject } from "./messages";

function changePrefix(address: string, newPrefix: string): string {
  return toBech32(newPrefix, fromBech32(address).data);
}

async function sendFeeAndStakingTokens(address: string): Promise<void> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
  const [firstAccount] = await wallet.getAccounts();
  const client = await SigningStargateClient.connectWithSigner(
    simapp.tendermintUrl,
    wallet,
    defaultSigningClientOptions,
  );

  const res = await client.sendTokens(
    firstAccount.address,
    address,
    [coin(11000, simapp.denomFee), coin(28, simapp.denomStaking)],
    "auto",
  );
  assertIsDeliverTxSuccess(res);
  client.disconnect();
}

describe("staking messages", () => {
  const createFee = calculateFee(200_000, defaultGasPrice);
  const editFee = calculateFee(200_000, defaultGasPrice);

  describe("MsgCreateValidator", () => {
    it("works", async () => {
      pendingWithoutSimapp();

      const valWallet = await DirectSecp256k1HdWallet.generate();
      const [valAccount] = await valWallet.getAccounts();

      await sendFeeAndStakingTokens(valAccount.address);

      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrl,
        valWallet,
        defaultSigningClientOptions,
      );

      const createMsg: MsgCreateValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgCreateValidator",
        value: {
          description: {
            moniker: "That's me",
            identity: "AABB1234",
            website: "http://example.com/me",
            details: "What should I write?",
            securityContact: "DM on Twitter",
          },
          commission: {
            maxChangeRate: "10000000000000000", // 0.01
            maxRate: "200000000000000000", // 0.2
            rate: "100000000000000000", // 0.1
          },
          minSelfDelegation: "1",
          // Those two addresses need to be the same with different prefix 🤷‍♂️
          delegatorAddress: valAccount.address,
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"),
          pubkey: encodePubkey({
            type: "tendermint/PubKeyEd25519",
            value: toBase64(Random.getBytes(32)),
          }),
          value: {
            amount: "1",
            denom: simapp.denomStaking,
          },
        },
      };
      const result = await client.signAndBroadcast(valAccount.address, [createMsg], createFee);

      assertIsDeliverTxSuccess(result);

      client.disconnect();
    });

    it("works with Amino JSON sign mode", async () => {
      pendingWithoutSimapp();

      const valWallet = await Secp256k1HdWallet.generate();
      const [valAccount] = await valWallet.getAccounts();

      await sendFeeAndStakingTokens(valAccount.address);

      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrl,
        valWallet,
        defaultSigningClientOptions,
      );

      const createMsg: MsgCreateValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgCreateValidator",
        value: {
          description: {
            moniker: "That's me",
            identity: "AABB1234",
            website: "http://example.com/me",
            details: "What should I write?",
            securityContact: "DM on Twitter",
          },
          commission: {
            maxChangeRate: "10000000000000000", // 0.01
            maxRate: "200000000000000000", // 0.2
            rate: "100000000000000000", // 0.1
          },
          minSelfDelegation: "1",
          // Those two addresses need to be the same with different prefix 🤷‍♂️
          delegatorAddress: valAccount.address,
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"),
          pubkey: encodePubkey({
            type: "tendermint/PubKeyEd25519",
            value: toBase64(Random.getBytes(32)),
          }),
          value: {
            amount: "1",
            denom: simapp.denomStaking,
          },
        },
      };
      const result = await client.signAndBroadcast(valAccount.address, [createMsg], createFee);

      assertIsDeliverTxSuccess(result);

      client.disconnect();
    });
  });

  describe("MsgEditValidator", () => {
    it("works", async () => {
      pendingWithoutSimapp();

      const valWallet = await DirectSecp256k1HdWallet.generate();
      const [valAccount] = await valWallet.getAccounts();

      await sendFeeAndStakingTokens(valAccount.address);

      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrl,
        valWallet,
        defaultSigningClientOptions,
      );

      const createMsg: MsgCreateValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgCreateValidator",
        value: {
          description: {
            moniker: "That's me",
            identity: "AABB1234",
            website: "http://example.com/me",
            details: "What should I write?",
            securityContact: "DM on Twitter",
          },
          commission: {
            maxChangeRate: "10000000000000000", // 0.01
            maxRate: "200000000000000000", // 0.2
            rate: "100000000000000000", // 0.1
          },
          minSelfDelegation: "1",
          // Those two addresses need to be the same with different prefix 🤷‍♂️
          delegatorAddress: valAccount.address,
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"),
          pubkey: encodePubkey({
            type: "tendermint/PubKeyEd25519",
            value: toBase64(Random.getBytes(32)),
          }),
          value: {
            amount: "1",
            denom: simapp.denomStaking,
          },
        },
      };
      const result = await client.signAndBroadcast(valAccount.address, [createMsg], createFee);
      assertIsDeliverTxSuccess(result);

      const editMsg: MsgEditValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgEditValidator",
        value: {
          commissionRate: "100000000000000000", // we cannot change until 24h have passed
          description: {
            moniker: "new name",
            identity: "ZZZZ",
            website: "http://example.com/new-site",
            details: "Still no idea",
            securityContact: "DM on Discord",
          },
          minSelfDelegation: "1",
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"), // unchanged
        },
      };
      const editResult = await client.signAndBroadcast(valAccount.address, [editMsg], editFee);

      // Currently we have no way to unset commissionRate, so the DeliverTx is expected to fail
      // with "commission cannot be changed more than once in 24h" :(
      assertIsDeliverTxFailure(editResult);

      client.disconnect();
    });

    it("works with Amino JSON sign mode", async () => {
      pendingWithoutSimapp();

      const valWallet = await Secp256k1HdWallet.generate();
      const [valAccount] = await valWallet.getAccounts();

      await sendFeeAndStakingTokens(valAccount.address);

      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrl,
        valWallet,
        defaultSigningClientOptions,
      );

      const createMsg: MsgCreateValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgCreateValidator",
        value: {
          description: {
            moniker: "That's me",
            identity: "AABB1234",
            website: "http://example.com/me",
            details: "What should I write?",
            securityContact: "DM on Twitter",
          },
          commission: {
            maxChangeRate: "10000000000000000", // 0.01
            maxRate: "200000000000000000", // 0.2
            rate: "100000000000000000", // 0.1
          },
          minSelfDelegation: "1",
          // Those two addresses need to be the same with different prefix 🤷‍♂️
          delegatorAddress: valAccount.address,
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"),
          pubkey: encodePubkey({
            type: "tendermint/PubKeyEd25519",
            value: toBase64(Random.getBytes(32)),
          }),
          value: {
            amount: "1",
            denom: simapp.denomStaking,
          },
        },
      };
      const result = await client.signAndBroadcast(valAccount.address, [createMsg], createFee);
      assertIsDeliverTxSuccess(result);

      const editMsg: MsgEditValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgEditValidator",
        value: {
          commissionRate: "100000000000000000", // we cannot change until 24h have passed
          description: {
            moniker: "new name",
            identity: "ZZZZ",
            website: "http://example.com/new-site",
            details: "Still no idea",
            securityContact: "DM on Discord",
          },
          minSelfDelegation: "1",
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"), // unchanged
        },
      };
      const editResult = await client.signAndBroadcast(valAccount.address, [editMsg], editFee);

      // Currently we have no way to unset commissionRate, so the DeliverTx is expected to fail
      // with "commission cannot be changed more than once in 24h" :(
      // assertIsDeliverTxSuccess(editResult);
      assertIsDeliverTxFailure(editResult);

      client.disconnect();
    });
  });
});
