import { getKYCData } from '@/app/actions/kyc.actions';
import { getLaborProfileStatus } from '@/app/actions/labor.actions';
import { getEconomicProfileStatus } from '@/app/actions/economic.actions';
import { getReferencesProfileStatus } from '@/app/actions/references.actions';
import { getAddressProfileStatus } from '@/app/actions/additional.actions';
import { getBankAccountProfileStatus } from '@/app/actions/bank-account.actions';
import { FunnelSummary } from '@/components/solicitar/SolicitarSummary';
import departamentosData from '@/lib/ubigeo_departamentos.json';
import provinciasData from '@/lib/ubigeo_provincias.json';
import distritosData from '@/lib/ubigeo_distritos.json';

const toTitleCase = (str: string) => {
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default async function FunnelSummaryPage() {
  // Obtener todos los datos de los formularios
  const [
    kycData,
    laborStatus,
    economicStatus,
    referencesStatus,
    addressStatus,
    bankAccountStatus
  ] = await Promise.all([
    getKYCData(),
    getLaborProfileStatus(),
    getEconomicProfileStatus(),
    getReferencesProfileStatus(),
    getAddressProfileStatus(),
    getBankAccountProfileStatus()
  ]);

  // Resolver nombres de ubigeo
  let ubigeoNames = { region: 'No especificado', province: 'No especificado', district: 'No especificado' };

  if (addressStatus.profile) {
    const departamento = (departamentosData as any).ubigeo_departamentos.find(
      (d: any) => String(d.id) === String(addressStatus.profile!.region)
    );
    const provincia = (provinciasData as any).ubigeo_provincias.find(
      (p: any) => String(p.id) === String(addressStatus.profile!.province)
    );
    const distrito = (distritosData as any).ubigeo_distritos.find(
      (d: any) => String(d.id) === String(addressStatus.profile!.district)
    );

    ubigeoNames = {
      region: departamento ? toTitleCase(departamento.departamento) : 'No especificado',
      province: provincia ? toTitleCase(provincia.provincia) : 'No especificado',
      district: distrito ? toTitleCase(distrito.distrito) : 'No especificado',
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
