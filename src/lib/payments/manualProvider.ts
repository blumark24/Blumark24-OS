import {
  assertPaymentProviderDisabledInThisPhase,
  getPaymentProviderConfigStatus,
  type CreateCheckoutInput,
  type CreateCheckoutResult,
  type PaymentProvider,
  type PaymentProviderConfigStatus,
} from "./provider";

export const manualPaymentProvider: PaymentProvider = {
  name: "manual",

  getConfigStatus(): PaymentProviderConfigStatus {
    return {
      ...getPaymentProviderConfigStatus("manual"),
      state: "not_configured",
      message: "Manual payment recording is not connected to a real checkout provider.",
    };
  },

  createCheckout(_input: CreateCheckoutInput): CreateCheckoutResult {
    return {
      ...assertPaymentProviderDisabledInThisPhase("manual"),
      status: "provider_not_configured",
      message: "Manual provider cannot create checkout sessions. No payment was created.",
    };
  },
};

export function getManualPaymentProvider(): PaymentProvider {
  return manualPaymentProvider;
}
