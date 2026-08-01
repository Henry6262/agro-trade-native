import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PlantationNftsService } from './plantation-nfts.service';

const UINT256_MAX =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

describe('PlantationNftsService', () => {
  let service: PlantationNftsService;
  let findUnique: jest.Mock;

  beforeEach(async () => {
    findUnique = jest.fn().mockResolvedValue({
      id: 'nft-1',
      tokenId: UINT256_MAX,
      ownerId: 'user-1',
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantationNftsService,
        {
          provide: PrismaService,
          useValue: {
            plantationNft: {
              findUnique,
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(PlantationNftsService);
  });

  it('looks up the full uint256 token ID without number coercion', async () => {
    await service.assertOwner(UINT256_MAX, 'user-1');

    expect(findUnique).toHaveBeenCalledWith({
      where: { tokenId: UINT256_MAX },
    });
  });

  it('canonicalizes leading zeroes before lookup', async () => {
    await service.assertOwner('00042', 'user-1');

    expect(findUnique).toHaveBeenCalledWith({ where: { tokenId: '42' } });
  });

  it('rejects malformed and overflowing token IDs', async () => {
    await expect(service.assertOwner('-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.assertOwner(`${UINT256_MAX}0`, 'user-1'),
    ).rejects.toThrow(BadRequestException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects a missing token or a different owner', async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(service.assertOwner('42', 'user-1')).rejects.toThrow(
      NotFoundException,
    );

    findUnique.mockResolvedValueOnce({
      id: 'nft-1',
      tokenId: '42',
      ownerId: 'user-2',
    });
    await expect(service.assertOwner('42', 'user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
