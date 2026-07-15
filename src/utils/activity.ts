import { MenstrualPhase } from '../types';

export interface ActivityRecommendation {
  title: string;
  phaseName: string;
  description: string;
  why: string;
  illnessNotes: string[];
}

export function generateActivityForDay(
  name: string,
  phase: MenstrualPhase,
  cycleDay: number,
  healthProfile: {
    isCeliac?: boolean;
    hasDiabetes?: boolean;
    hasObesity?: boolean;
    hasDepression?: boolean;
  }
): ActivityRecommendation {
  // We use cycleDay as a seed to select varying recommendations so they see a unique recommended activity for each day
  const index = cycleDay % 3;

  let title = "";
  let description = "";
  let why = "";
  const illnessNotes: string[] = [];

  const phaseNames = {
    Menstrual: "Menstruación",
    Folicular: "Fase Folicular",
    Ovulacion: "Ovulación",
    Lutea: "Fase Lútea"
  };

  if (phase === 'Menstrual') {
    const options = [
      {
        title: "Sesión de Yoga Restaurativo y Estiramientos Profundos",
        description: `${name}, para hoy en tu fase de Menstruación (Día ${cycleDay}), te recomendamos realizar una sesión suave de yoga restaurativo con énfasis en la pelvis y la espalda baja. Enfócate en posturas como el Niño (Balasana) y la Mariposa reclinada (Supta Baddha Konasana), usando almohadas para apoyarte. Mantén una respiración abdominal lenta y profunda durante 20 minutos.`,
        why: "Esta actividad está especialmente recomendada porque durante la menstruación tus niveles de estrógeno y progesterona están en su punto más bajo, disminuyendo tu energía física. El yoga suave mejora el flujo sanguíneo hacia la región pélvica, ayudando a aliviar los cólicos menstruales de forma natural, reduciendo la tensión muscular acumulada en la espalda y estimulando el sistema nervioso parasimpático para reducir el cansancio."
      },
      {
        title: "Caminata Meditativa a Ritmo Suave al Aire Libre",
        description: `${name}, para este día ${cycleDay} de tu fase Menstrual, te sugerimos una caminata de baja intensidad de 15 a 20 minutos en un parque o entorno natural. Camina a un paso relajado, concentrándote en el contacto de tus pies con el suelo y en el aire fresco.`,
        why: "La caminata ligera al aire libre es sumamente idónea porque oxigena tus tejidos sin elevar el cortisol (la hormona del estrés), que ya tiende a fluctuar debido al inicio del ciclo menstrual. Además, estimula la circulación para mitigar dolores de cabeza y pesadez física, a la vez que promueve un descanso nocturno profundo."
      },
      {
        title: "Ejercicios de Respiración Convocada y Autocuidado con Calor Local",
        description: `${name}, en este día ${cycleDay} de tu ciclo (Fase Menstrual), te recomendamos una sesión de respiración diafragmática pausada (técnica 4-7-8) combinada con la aplicación de una compresa tibia sobre tu vientre o zona lumbar durante 20 minutos.`,
        why: "Dado que el útero se está contrayendo para liberar el endometrio, el calor local relaja directamente las fibras musculares uterinas reduciendo la intensidad de los cólicos. La respiración diafragmática calma el sistema de alerta del cuerpo, reduce la percepción del dolor y combate la fatiga menstrual recurrente."
      }
    ];
    const sel = options[index];
    title = sel.title;
    description = sel.description;
    why = sel.why;

    // Illnesses for Menstrual
    if (healthProfile.isCeliac) {
      illnessNotes.push(
        "🌾 Celiaquía: En la fase menstrual, la inflamación intestinal puede exacerbarse debido a las prostaglandinas. El yoga suave o la caminata estimulan la motilidad intestinal de manera amigable, aliviando la hinchazón y las molestias digestivas. Evita alimentos inflamatorios y prefiere infusiones calientes libres de gluten."
      );
    }
    if (healthProfile.hasDiabetes) {
      illnessNotes.push(
        "🩸 Diabetes: Debido a los cambios hormonales, tu sensibilidad a la insulina puede disminuir ligeramente en estos días menstruales. Realizar actividad física de baja intensidad y mantener un registro de tus niveles es clave. Este tipo de ejercicio ligero ayuda a mantener estables las glucemias sin el riesgo de hipoglucemia brusca."
      );
    }
    if (healthProfile.hasObesity) {
      illnessNotes.push(
        "⚖️ Obesidad: Los estiramientos de bajo impacto protegen tus articulaciones de la sobrecarga mientras tu cuerpo está más sensible. Caminar o estirar ayuda a mantener activo el metabolismo graso sin generar un estrés cardiovascular innecesario en un momento de baja energía."
      );
    }
    if (healthProfile.hasDepression) {
      illnessNotes.push(
        "🧠 Depresión: El bajón de estrógeno puede asociarse con apatía y sentimientos de tristeza. Una caminata meditativa al aire libre o el yoga suave promueven la autocompasión, estimulan la liberación de endorfinas y te ayudan a salir de la rumiación mental de manera gentil."
      );
    }

  } else if (phase === 'Folicular') {
    const options = [
      {
        title: "Entrenamiento de Fuerza con Peso Corporal (Calistenia)",
        description: `${name}, para hoy en tu Fase Folicular (Día ${cycleDay}), te sugerimos un entrenamiento de fuerza de intensidad moderada, utilizando tu propio peso corporal (sentadillas, flexiones apoyadas, zancadas y planchas). Realiza 3 series de 10 repeticiones por ejercicio con descansos de 1 minuto.`,
        why: "La actividad de fuerza es ideal ahora porque el estrógeno ascendente aumenta progresivamente tu fuerza muscular, energía y síntesis de proteínas. Tu cuerpo es altamente eficiente utilizando glucógeno como combustible, lo que te permite desarrollar masa muscular con excelente capacidad de recuperación."
      },
      {
        title: "Sesión de Cardio Dinámico de Ritmo Moderado (Power Walking o Ciclismo)",
        description: `${name}, para hoy en tu Fase Folicular (Día ${cycleDay}), te sugerimos 30 minutos de ciclismo ligero o caminata rápida (Power Walking). Mantén una intensidad en la que puedas hablar pero con esfuerzo constante.`,
        why: "El incremento de estrógeno optimiza tu capacidad cardiovascular y respiratoria. Esta actividad estimula el sistema circulatorio, elevando tus niveles naturales de serotonina, mejorando la concentración y aprovechando al máximo tu motivación mental en esta fase de renovación."
      },
      {
        title: "Entrenamiento de Resistencia y Core (Pilates Dinámico)",
        description: `${name}, hoy en tu Día ${cycleDay} (Fase Folicular), te recomendamos una sesión de Pilates dinámico enfocada en el fortalecimiento del core, glúteos y espalda. Realiza movimientos fluidos y controlados durante 25 minutos.`,
        why: "Durante la fase folicular, la elasticidad del colágeno es alta, lo que favorece la flexibilidad articular y la alineación muscular. Esta sesión tonifica el core de forma óptima, capitalizando tu nivel de energía física en aumento."
      }
    ];
    const sel = options[index];
    title = sel.title;
    description = sel.description;
    why = sel.why;

    // Illnesses for Folicular
    if (healthProfile.isCeliac) {
      illnessNotes.push(
        "🌾 Celiaquía: Con tus niveles de energía en alza y una menor sensibilidad intestinal, es una fase maravillosa para asimilar micronutrientes esenciales como el hierro y el calcio (vitales en dietas sin gluten). El ejercicio de fuerza moderado promueve la remodelación ósea sana."
      );
    }
    if (healthProfile.hasDiabetes) {
      illnessNotes.push(
        "🩸 Diabetes: El estrógeno ascendente mejora significativamente la sensibilidad a la insulina. El entrenamiento de fuerza es una herramienta extremadamente eficaz en esta fase para potenciar el transporte de glucosa GLUT4 hacia los músculos, permitiendo un excelente control glucémico con menores requerimientos de insulina."
      );
    }
    if (healthProfile.hasObesity) {
      illnessNotes.push(
        "⚖️ Obesidad: Aprovecha la mayor vitalidad física de esta fase para realizar zancadas y sentadillas con buena técnica. Esto incrementa tu tasa metabólica en reposo y fortalece tus músculos de soporte corporal, cuidando tus rodillas mediante una progresión controlada."
      );
    }
    if (healthProfile.hasDepression) {
      illnessNotes.push(
        "🧠 Depresión: El aumento de estrógeno mejora tu estado de ánimo de forma natural. Sumar un entrenamiento dinámico acelera la producción de dopamina y factor neurotrófico derivado del cerebro (BDNF), ayudando a consolidar hábitos de vida activos y combatiendo de frente la neblina mental y la anhedonia."
      );
    }

  } else if (phase === 'Ovulacion') {
    const options = [
      {
        title: "Entrenamiento de Alta Intensidad por Intervalos (HIIT)",
        description: `${name}, hoy en tu fase de Ovulación (Día ${cycleDay}), te recomendamos un entrenamiento tipo HIIT de 20 minutos (20 segundos de esfuerzo máximo como jumping jacks o burpees, seguidos de 40 segundos de descanso activo). Completa 3 rondas.`,
        why: "La ovulación es tu pico de estrógeno y testosterona, lo que te dota de tu fuerza física, resistencia y potencia máxima de todo el ciclo. El HIIT te ayuda a liberar este excedente de energía, mejora la función cardiovascular rápidamente y activa la quema de lípidos de forma muy eficiente."
      },
      {
        title: "Sesión de Running de Ritmo Sostenido o Clase de Baile Dinámica",
        description: `${name}, para hoy en tu fase de Ovulación (Día ${cycleDay}), te recomendamos una carrera de ritmo sostenido de 25 minutos o una clase de baile de alto ritmo energético para divertirte al máximo.`,
        why: "Tus hormonas te otorgan un excelente nivel de coordinación, agilidad y confianza. Al estar en tu momento más sociable y magnético, las clases de baile o correr te hacen sentir vital, conectada y radiante."
      },
      {
        title: "Entrenamiento de Fuerza Máxima o Levantamiento de Peso Controlado",
        description: `${name}, en este día ${cycleDay} de tu ciclo (Fase de Ovulación), te sugerimos un entrenamiento de fuerza con pesas o mancuernas para retar tus músculos de manera segura. Realiza levantamientos lentos y controlados de tus grupos musculares mayores.`,
        why: "Debido a la influencia de la testosterona, tu fuerza muscular se encuentra en el nivel más alto del mes. Es el momento perfecto para levantar cargas moderadas-altas con excelente técnica, promoviendo la hipertrofia muscular y la salud metabólica óptima."
      }
    ];
    const sel = options[index];
    title = sel.title;
    description = sel.description;
    why = sel.why;

    // Illnesses for Ovulation
    if (healthProfile.isCeliac) {
      illnessNotes.push(
        "🌾 Celiaquía: Tu microbiota intestinal se beneficia notablemente del ejercicio cardiovascular vigoroso como el HIIT, ya que reduce la inflamación sistémica. Acompaña tu día con alimentos ricos en antioxidantes sin gluten para potenciar tu recuperación muscular rápida."
      );
    }
    if (healthProfile.hasDiabetes) {
      illnessNotes.push(
        "🩸 Diabetes: Ten en cuenta que el ejercicio de alta intensidad puede producir una liberación de adrenalina que aumente temporalmente los niveles de azúcar en sangre inmediatamente después del entrenamiento, seguido de una caída posterior. Revisa tu glucosa y mantente bien hidratada."
      );
    }
    if (healthProfile.hasObesity) {
      illnessNotes.push(
        "⚖️ Obesidad: Durante el pico estrogénico, la laxitud de tus ligamentos aumenta, lo que eleva el riesgo de lesiones de rodilla o tobillo. Realiza el HIIT o carrera con calzado amortiguado y evita saltos de alto impacto si sientes molestias; prefiere alternativas de bajo impacto como bicicleta estática rápida."
      );
    }
    if (healthProfile.hasDepression) {
      illnessNotes.push(
        "🧠 Depresión: Tu cerebro cuenta hoy con un entorno hormonal protector muy favorable. El ejercicio vigoroso genera una oleada de endorfinas y serotonina que actúa como un antidepresivo natural de gran potencia, fortaleciendo tu resiliencia emocional y promoviendo la socialización."
      );
    }

  } else { // Lutea
    const options = [
      {
        title: "Sesión de Pilates de Pared o Control Postural",
        description: `${name}, hoy en tu Fase Lútea (Día ${cycleDay}), te recomendamos realizar una rutina de Pilates de pared de 25 minutos. Concéntrate en movimientos controlados para fortalecer el transverso abdominal, glúteos e isquiotibiales utilizando la pared como resistencia.`,
        why: "La progesterona es la hormona dominante en esta fase, promoviendo la introspección y la conservación de energía. El Pilates de pared permite entrenar la resistencia muscular de forma profunda sin aumentar la fatiga cardiovascular, protegiendo tus articulaciones y evitando el agotamiento premenstrual."
      },
      {
        title: "Caminata de Resistencia Ligera-Moderada en la Naturaleza",
        description: `${name}, para hoy en tu Fase Lútea (Día ${cycleDay}), te sugerimos una caminata continua a paso moderado de 30 a 40 minutos. Mantén una respiración rítmica y enfócate en el paisaje para relajar tu mente.`,
        why: "El ejercicio de resistencia de baja intensidad es idóneo en la fase lútea porque favorece el uso de ácidos grasos como fuente de combustible y contrarresta la tendencia a la retención de líquidos. Además, ayuda a mantener estables los niveles de energía física y emocional."
      },
      {
        title: "Yoga Vinyasa Suave y Flexibilidad para el Core",
        description: `${name}, en este día ${cycleDay} de tu ciclo (Fase Lútea), te recomendamos realizar una sesión de yoga Vinyasa fluido de ritmo suave enfocado en abrir caderas y estirar la columna. Finaliza con 5 minutos de relajación guiada (Savasana).`,
        why: "Hacia el final del ciclo menstrual, el cuerpo acumula tensión muscular y retención hídrica. El yoga suave disminuye de manera notable el cortisol en sangre, alivia la hinchazón corporal propia del síndrome premenstrual y fomenta un sueño reparador y conciliador."
      }
    ];
    const sel = options[index];
    title = sel.title;
    description = sel.description;
    why = sel.why;

    // Illnesses for Lutea
    if (healthProfile.isCeliac) {
      illnessNotes.push(
        "🌾 Celiaquía: En la fase lútea, los síntomas gastrointestinales (estreñimiento, gases) suelen aumentar debido a la progesterona que ralentiza la digestión. El Pilates y las torsiones suaves de yoga ayudan a masajear el tracto gastrointestinal de forma natural, favoreciendo una digestión liviana y reduciendo el SPM."
      );
    }
    if (healthProfile.hasDiabetes) {
      illnessNotes.push(
        "🩸 Diabetes: La progesterona puede inducir un estado de resistencia temporal a la insulina en la segunda mitad de tu fase lútea, lo que podría elevar tus niveles basales de azúcar. El ejercicio continuo y moderado como el Pilates es excelente para sensibilizar los receptores de insulina de forma estable."
      );
    }
    if (healthProfile.hasObesity) {
      illnessNotes.push(
        "⚖️ Obesidad: Es común sentir mayor apetito y antojos por carbohidratos en esta fase. El Pilates o caminar te ayuda a gestionar el peso corporal y mitigar el estrés emocional que gatilla la ingesta por ansiedad, con un impacto articular sumamente seguro."
      );
    }
    if (healthProfile.hasDepression) {
      illnessNotes.push(
        "🧠 Depresión: El descenso de estrógenos en esta fase lútea tardía puede precipitar el mal humor, el llanto fácil o la irritabilidad. El Pilates o la caminata consciente actúan como un anclaje mental, ayudándote a canalizar emociones pesadas y a liberar endorfinas que atenúan la melancolía premenstrual."
      );
    }
  }

  return {
    title,
    phaseName: phaseNames[phase],
    description,
    why,
    illnessNotes
  };
}
