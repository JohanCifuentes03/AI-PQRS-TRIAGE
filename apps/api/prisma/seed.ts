import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const samplePqrs = [
    {
      texto:
        'En la Calle 72 con Carrera 15 hay acumulación de basuras desde hace más de una semana. Los vecinos hemos reportado en múltiples ocasiones pero no ha habido respuesta. Hay riesgo sanitario por olores y presencia de roedores.',
      canal: 'web',
      tipo: 'Queja',
      tema: 'Medio Ambiente',
      subtema: 'Recolección de residuos',
      urgencia: 'Alta',
      entidad: 'UAESP',
      riesgo: 'Riesgo sanitario por acumulación de residuos',
      resumen: 'Acumulación de basuras en Calle 72 con Cra 15, riesgo sanitario reportado',
      confianza: 0.94,
      estado: 'pendiente',
    },
    {
      texto:
        'Solicito la reparación del alumbrado público en la esquina de la Carrera 15 con Calle 80. Lleva más de un mes sin funcionar y la zona queda completamente oscura en la noche, generando inseguridad.',
      canal: 'web',
      tipo: 'Peticion',
      tema: 'Infraestructura',
      subtema: 'Alumbrado público',
      urgencia: 'Media',
      entidad: 'CODENSA S.A.',
      riesgo: 'Ninguno',
      resumen: 'Solicitud de reparación de alumbrado público en Cra 15 con Cll 80',
      confianza: 0.88,
      estado: 'pendiente',
    },
    {
      texto:
        'Hay un árbol muy grande en el parque del barrio que tiene ramas tocando los cables de energía. Con el viento las ramas se mueven y pueden causar un cortocircuito o caer sobre alguien. Es urgente.',
      canal: 'presencial',
      tipo: 'Peticion',
      tema: 'Medio Ambiente',
      subtema: 'Podadura de árboles',
      urgencia: 'Baja',
      entidad: 'Jardín Botánico',
      riesgo: 'Riesgo por ramas en cables eléctricos',
      resumen: 'Árbol con ramas tocando cables eléctricos en parque, requiere poda urgente',
      confianza: 0.79,
      estado: 'pendiente',
    },
    {
      texto:
        'El establecimiento comercial "Rumba Total" ubicado en la Zona T supera los límites de decibeles permitidos después de las 11:00 PM todos los fines de semana. Los vecinos no podemos dormir y ya hemos llamado a la línea 123 sin respuesta.',
      canal: 'escrito',
      tipo: 'Queja',
      tema: 'Convivencia',
      subtema: 'Contaminación auditiva',
      urgencia: 'Alta',
      entidad: 'Secretaría de Gobierno',
      riesgo: 'Violación normativa de niveles de ruido',
      resumen: 'Contaminación auditiva por nightclub en Zona T después de 11PM',
      confianza: 0.91,
      estado: 'pendiente',
    },
    {
      texto:
        'Hay cables sueltos de energía colgando en la Carrera 7 con Calle 50, frente al parque. Los niños juegan cerca de ahí y es un peligro inminente de electrocución. Necesitan venir de emergencia.',
      canal: 'presencial',
      tipo: 'Queja',
      tema: 'Infraestructura',
      subtema: 'Red eléctrica',
      urgencia: 'Alta',
      entidad: 'CODENSA S.A.',
      riesgo: 'Riesgo vital - cables sueltos con peligro de electrocución',
      resumen: 'Cables sueltos de energía en Cra 7 con Cll 50, riesgo de electrocución',
      confianza: 0.97,
      estado: 'pendiente',
    },
    {
      texto:
        'Quiero felicitar al equipo de la Secretaría de Movilidad por la rápida atención al semáforo dañado en la Av. El Dorado con Cra 30. Fue reportado el lunes y para el martes ya estaba funcionando.',
      canal: 'web',
      tipo: 'Felicitacion',
      tema: 'Movilidad',
      subtema: 'Semáforos',
      urgencia: 'Baja',
      entidad: 'Secretaría de Movilidad',
      riesgo: 'Ninguno',
      resumen: 'Felicitación por reparación oportuna de semáforo en Av El Dorado',
      confianza: 0.95,
      estado: 'aprobado',
    },
    {
      texto:
        'La EPS Sanitas no ha autorizado la cita con el especialista que mi médico tratante solicitó hace 45 días. Tengo dolor crónico y necesito atención urgente. Ya presenté queja internamente sin respuesta.',
      canal: 'escrito',
      tipo: 'Reclamo',
      tema: 'Salud',
      subtema: 'Servicio de EPS',
      urgencia: 'Alta',
      entidad: 'SDS',
      riesgo: 'Riesgo en salud del paciente por demora en autorización',
      resumen: 'Demora de 45 días en autorización de cita especializada en EPS Sanitas',
      confianza: 0.89,
      estado: 'aprobado',
    },
    {
      texto:
        'Propongo que se implemente un sistema de bicicletas públicas en la localidad de Ciudad Bolívar. Actualmente no hay ninguna estación y el transporte público es insuficiente para la demanda.',
      canal: 'web',
      tipo: 'Sugerencia',
      tema: 'Movilidad',
      subtema: 'Transporte alternativo',
      urgencia: 'Baja',
      entidad: 'IDU',
      riesgo: 'Ninguno',
      resumen: 'Propuesta de sistema de bicicletas públicas para Ciudad Bolívar',
      confianza: 0.82,
      estado: 'pendiente',
    },
  ];

  for (const pqrs of samplePqrs) {
    await prisma.pqrs.create({ data: pqrs });
  }

  console.log(`Seeded ${samplePqrs.length} PQRS records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
