import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePersonRequestDto, UpdatePersonRequestDto, PersonResponseData } from './person.dto'; // Укажите правильный относительный путь

describe('Person DTOs', () => {
  const validCreatePayload = {
    firstName: '  Иван  ', // Проверяем trim()
    lastName: '  Иванов  ',
    middleName: '  Иванович  ',
    birthday: '1990-01-15',
    regionCode: '  ru  ', // Наследуется из BaseRegionCodeRequestDto (проверяем trim и uppercase)
    timezone: '  Europe/Moscow  ',
    channels: [],
  };

  describe('CreatePersonRequestDto', () => {
    it('should successfully validate with valid data and apply string transformations', async () => {
      const dto = plainToInstance(CreatePersonRequestDto, validCreatePayload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.firstName).toBe('Иван');
      expect(dto.lastName).toBe('Иванов');
      expect(dto.middleName).toBe('Иванович');
      expect(dto.regionCode).toBe('RU');
      expect(dto.timezone).toBe('Europe/Moscow');
    });

    it('should pass validation without middleName (IsOptional)', async () => {
      const plain: Partial<typeof validCreatePayload> = { ...validCreatePayload };
      delete plain.middleName;

      const dto = plainToInstance(CreatePersonRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.middleName).toBeUndefined();
    });

    it('should fail validation if mandatory fields are missing', async () => {
      const plain = {
        middleName: 'Петрович',
      };
      const dto = plainToInstance(CreatePersonRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const targetProperties = errors.map((err) => err.property);
      expect(targetProperties).toContain('firstName');
      expect(targetProperties).toContain('lastName');
      expect(targetProperties).toContain('birthday');
      expect(targetProperties).toContain('regionCode'); // Проверка обязательности из BaseRegionCodeRequestDto
      expect(targetProperties).toContain('timezone');
    });

    it('should fail validation if birthday is not a valid ISO8601 string', async () => {
      const plain = {
        ...validCreatePayload,
        birthday: '15-01-1990', // Неверный формат (должен быть YYYY-MM-DD)
      };
      const dto = plainToInstance(CreatePersonRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('birthday');
    });
  });

  describe('UpdatePersonRequestDto', () => {
    it('should validate successfully when all fields except id are omitted (PartialType)', async () => {
      const plainUpdate = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9', // Передаем только обязательный ID
      };

      const dto = plainToInstance(UpdatePersonRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.id).toBe('4fa0e21a-e7be-4b95-8df4-069c3a3cfef9');
    });

    it('should fail if id is missing or not a valid UUIDv4', async () => {
      const plainUpdate = {
        id: 'invalid-id-format',
      };

      const dto = plainToInstance(UpdatePersonRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('id');
    });

    it('should fail validation if provided fields inside update violate validation rules', async () => {
      const plainUpdate = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9',
        birthday: 'not-a-date',
      };

      const dto = plainToInstance(UpdatePersonRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('birthday');
    });

    it('should deeply validate nested update channels array if provided', async () => {
      const plainUpdate = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9',
        channels: [
          {
            id: 'invalid-nested-uuid', // Вызовет ошибку во вложенном UpdatePersonChannelRequestData
          },
        ],
      };

      const dto = plainToInstance(UpdatePersonRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('channels');
      expect(errors[0].children?.length).toBeGreaterThan(0);
    });
  });

  describe('PersonResponseData', () => {
    it('should correctly build response data structure including inherited fields', () => {
      const response = new PersonResponseData();
      response.id = 'person-uuid-999';
      response.regionCode = 'RU';
      response.firstName = 'Иван';
      response.lastName = 'Иванов';
      response.middleName = 'Иванович';
      response.birthday = '1990-01-15';
      response.timezone = 'Europe/Moscow';
      response.channels = [];

      expect(response.id).toBe('person-uuid-999');
      expect(response.regionCode).toBe('RU');
      expect(response.firstName).toBe('Иван');
      expect(response.lastName).toBe('Иванов');
      expect(response.middleName).toBe('Иванович');
      expect(response.birthday).toBe('1990-01-15');
      expect(response.timezone).toBe('Europe/Moscow');
      expect(response.channels).toEqual([]);
    });
  });
});
