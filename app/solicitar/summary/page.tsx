import { getKYCData } from '@/app/actions/kyc.actions';
import { getLaborProfileStatus } from '@/app/actions/labor.actions';
import { getEconomicProfileStatus } from '@/app/actions/economic.actions';
import { getReferencesProfileStatus } from '@/app/actions/references.actions';
import { getAddressProfileStatus, getDepartamentosAction, getProvinciasAction, getDistritosAction } from '@/app/actions/additional-address.actions';
import { getBankAccountProfileStatus } from '@/app/actions/bank-account.actions';
import { FunnelSummary } from '@/components/solicitar/SolicitarSummary';

export default async function FunnelSummaryPage() {
  const [
    kycData,
    laborStatus,
    economicStatus,
    referencesStatus,
    addressStatus,
    bankAccountStatus,
  ] = await Promise.all([
    getKYCData(),
    getLaborProfileStatus(),
    getEconomicProfileStatus(),
    getReferencesProfileStatus(),
    getAddressProfileStatus(),
    getBankAccountProfileStatus(),
  ]);

  // Resolver nombres de ubigeo desde el backend
  let ubigeoNames = { region: 'No especificado', province: 'No especificado', district: 'No especificado' };

  if (addressStatus.profile) {
    const { region, province, district } = addressStatus.profile;

    const [departamentos, provincias, distritos] = await Promise.all([
      getDepartamentosAction(),
      region  ? getProvinciasAction(region)   : Promise.resolve([]),
      province ? getDistritosAction(province) : Promise.resolve([]),
    ]);

    ubigeoNames = {
      region:   departamentos.find((d) => d.value === region)?.label   ?? 'No especificado',
      province: provincias.find((p) => p.value === province)?.label    ?? 'No especificado',
      district: distritos.find((d) => d.value === district)?.label     ?? 'No especificado',
    };
  }

  return (
    <FunnelSummary
      kycData={kycData.data}
      laborData={laborStatus}
      economicData={economicStatus}
      referencesData={referencesStatus}
      addressData={addressStatus}
      bankAccountData={bankAccountStatus}
      ubigeoNames={ubigeoNames}
    />
  );
}
